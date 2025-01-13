const crypto = require('crypto');
const SECRET_KEY =  crypto.randomBytes(64).toString('hex'); 


const express=require("express");
const bodyParser=require("body-parser");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const path = require("path");  // Add this line

const app=express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));  // Serve static files from the 'public' directory

const users={};// In memory-storage for demonstration


app.post("/signup",async(req,res)=>{
   const{username,password}=req.body;
   console.log("Signup request received:", req.body);  // Log request data for signup
   if(users[username]){
    return res.json({message: "User already exist!"});
   }

const hashedPassword=await bcrypt.hash(password,10);
users[username]=hashedPassword;
res.json({message: "Signup successful!" });
});

app.post("/login",async(req,res)=>{
   const {username,password}=req.body;
   console.log("Login request received:", req.body);  // Log request data for login
   const userPassword=users[username];

   if(!userPassword||!(await bcrypt.compare(password,userPassword))){
      return res.json({ success: false, message: "Invalid credentials!" });
   }

   const token=jwt.sign({username},SECRET_KEY,{expiresIn:"1hr"});
   res.json({ success: true, token });
});
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
