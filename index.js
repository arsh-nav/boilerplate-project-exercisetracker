const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");
const uri = "mongodb+srv://arshianawab:Ars113733@cluster0.3dbgrow.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
app.use(cors())
app.use(express.static('public'))
// app.use(express.json());
app.use(express.urlencoded({ extended: true }));
mongoose.connect(uri,{
  useNewUrlParser: true,
  useUnifiedTopology: true    
})
.then(()=>console.log("MongoDB Connected!"))
.catch(err => console.error("MongoDB Connection Error:",err));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const Schema = mongoose.Schema;
const userSchema = new Schema({
  username:{type:String,required:true}
});
const User = mongoose.model("User",userSchema);
// POST endpoint
app.post('/api/users', async(req, res) => {
  const username = req.body.username;
  const newUser = new User({username});
  await newUser.save();
  res.json({username:newUser.username,_id:newUser._id});
});
app.get('/api/users', async(req,res) => {
  try{
    const users = await User.find({},{username:1,_id:1});
    res.json(users);
  }
  catch (err){
    res.status(500).json({error: 'Server Error'});
  }
});

const exerciseSchema = new Schema({
  description: {type:String , required:true},
  duration: {type: Number , required:true},
  date:{type:Date},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
const Exercise = mongoose.model("Exercise", exerciseSchema);
app.post('/api/users/:_id/exercises',async(req,res)=>{
  
  const desc = req.body.description;
  const dur = req.body.duration;
  let _date = req.body.date ? new Date(req.body.date) : new Date();
  const userId = req.params._id;
  if (isNaN(_date.getTime())) return res.status(400).json({ error: "Invalid date format" });
  if (isNaN(dur)) return res.status(400).json({ error: "Duration must be a number" });
  const newExercise = new Exercise({
    description:desc,
    duration:Number(dur),
    date:_date,
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  const clientUsername = await User.findById(userId, "username");
  if (!clientUsername) return res.status(404).json({ error: "User not found" });
  await newExercise.save();
  res.json({
    description:desc,
    duration:Number(dur),
    date:_date.toDateString(),
    _id:userId,
    username: clientUsername.username
  });
});

app.get('/api/users/:_id/logs',async(req,res)=>{
  const userId = req.params._id;
  const fromD = req.query.from ? new Date(req.query.from) : null;
const toD = req.query.to ? new Date(req.query.to) : null;

// Start with base query
const query = { userId: userId };
// Execute query with optional limit
const user = await Exercise.find(
  query,
  { userId: 1, _id: 0 }
);
  const id = await User.findOne(
    {_id: userId},
    {username:1}
  );
  let log;
  // Add date conditions if provided
if (fromD && toD) {
  query.date = { $gte: fromD, $lte: toD };
} else if (fromD) {
  query.date = { $gte: fromD };
} else if (toD) {
  query.date = { $lte: toD };
}
  log = Exercise.find(
  query,
  { description: 1, duration: 1, date: 1, _id: 0 }
).limit(Number(req.query.limit) || 0);

const formattedLog = log.map(ex => ({
  description: ex.description,
  duration: ex.duration,
  date: ex.date.toDateString()
}));

  res.json({
    username:id.username,  
    count: log.length,  
    _id: userId, 
    log: formattedLog
  })  
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
