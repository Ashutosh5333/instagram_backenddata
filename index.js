const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt= require("bcrypt")
const cors = require("cors")
const { connection } = require("./config/db")
const {Usermodel} = require("./models/User.model")
const { authenticate } = require("./middleware/authenticate")
const { productRouter } = require("./routes/product.route")
const { profileRouter } = require("./routes/Profileuser.route")
const { ReelRouter } = require("./routes/Reel.route")

const app = express()
app.use(express.json())

app.use(cors({
  origin:"*"
}))


app.get("/" , (req,res) => {
    res.send("welcome home")
})


app.get("/user/:uId", async (req,res) => {
    const uId = req.params.uId
    const user = await Usermodel.findOne({_id:uId}).select("-password")
    res.send(user)
})


  app.patch("/user/edit/:uId" , async (req,res) =>{
  const uId = req.params.uId
  const payload=req.body
  try{
     const productdata = await Usermodel.findByIdAndUpdate({_id:uId},payload)
     res.send({"msg" :"image updated sucessfully" })
  }catch(err){
    console.log(err)
    res.send({"msg" :"Something went wrongs"})
   }
})




app.get("/user", async (req,res) => {
  const user = await Usermodel.find()
  res.send(user)
})




app.post("/signup", async(req,res) => {
  const {email,password,name}= req.body;
     const userPresent = await Usermodel.findOne({email})
       if(userPresent){
         res.send("user is alredy present")
         return 
       }
   try{
     bcrypt.hash(password, 4, async function(err, hash) {
         const user = new Usermodel({email,password:hash,name})
         await user.save()
         res.send("Signup sucesfully")
     })
   }
   catch(err){
     console.log(err)
     res.send("Something went wrong ply try again later")
   }
})



app.post("/login", async(req,res) =>{
  const {email,password,name,_id,image} = req.body;
  
  try{
    
   const user = await Usermodel.find({email})
      console.log(user)

     if(user.length > 0){
        const hashed_password = user[0].password;
  
        bcrypt.compare(password,hashed_password,function(err, result){
            if(result){
       
                const token= jwt.sign({userId:user[0]._id}, "hush");
                res.send({"msg":"Login sucessfull", "token":token , data:{
                     name:user[0].name,
                     email:user[0].email,
                      _id:user[0]._id,
                 } })
            }
            else{
              res.send("Please check password")
            }

        }) }
        else{
          res.send("first registered")
        }
  }
  catch{
    res.send("authentication failed 3")
  }
})


  //  app.put("/follow/:uId", async (req,res) =>{
    
  //       const userId = req.body.userId
  //       Usermodel.findByIdAndUpdate(req.params.uId,{
  //         $push:{followers:userId}
  //     },{
  //       new:true,
  //     }), (err,result) => {
  //          if(err){
  //             return res.status(422).json({error:err})
  //          }
  //           Usermodel.findByIdAndUpdate(req.params.uId,{ 
  //            $push:{following:userId}
  //        },{
  //          new:true 
  //        }).then(result =>{
  //          res.json(result)
  //        }).catch(err =>{
  //           return res.status(422).json({error:err})
  //           // console.log(err)
  //        })
  //      }
 
  //  })




  app.put("/follow",authenticate, (req,res) =>{
      
      const userId = req.body.userId
         Usermodel.findByIdAndUpdate(req.body.followId,{
         $push:{followers:userId}

     },{
       new:true,
     }), (err,result) => {
          if(err){
             return res.status(422).json({error:err})
          }
           Usermodel.findByIdAndUpdate(userId,{
            $push:{following: req.body.followId}
        },{
          new:true 
        }).then(result =>{
          res.json(result)
        }).catch(err => {
           return res.status(422).json({error:err})
        })
      }
 })



 app.put("/unfollow", async (req,res) =>{
  const userId = req.body.userId
      Usermodel.findByIdAndUpdate(req.body.unfollowId,{
     $pull:{followers:userId}
 },{
   new:true,
 }), (err,result) =>{
      if(err){ 
         return res.status(422).json({error:err})
      }
       Usermodel.findByIdAndUpdate(userId,{
        $pull:{following:req.body.unfollowId}
    },{
      new:true
    }).then(result =>{
      res.json(result)
    }).catch(err =>{
       return res.status(422).json({error:err})
    })
  }
})

    

app.use(authenticate)
app.use(ReelRouter) 
app.use(productRouter)
app.use(profileRouter)



app.listen(8000, async (req,res) =>{
      try{
        await connection;
        console.log("connected to database")
      }
      catch(err){
        console.log("something went wrong in connected")
        console.log(err)
      }

    console.log("listening on port 8000")
})


