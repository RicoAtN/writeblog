//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const _ = require('lodash');

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Setup session for active logins
app.use(session({
  secret: "Our little secret weehee.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "https://rico.ngo/auth/google/compose",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  // console.log(profile);

  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

// Connect with MongoDB Atlas
mongoose.connect("mongodb+srv://RicoN:test12345@cluster0.g1jhf.mongodb.net/RicoPersonalWebsite?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

// Create DB schema to login - master user

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Add Mongoose user model based on this schema
const User = new mongoose.model("MasterUser", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Create DB schema for blogs
const blogSchema = {
  title: {
    type: String,
    required: [true, "You need to add a a title."]
  },
  content: String
};

// Add Mongoose blog model based on this schema
const Blog = mongoose.model("blogscollection", blogSchema);

// Render pages

app.get("/", function(req, res) {

  Blog.find({}, function(err, blogs){
    res.render("home", {
      firstParagraph: homeStartingContent, blogContents: blogs
    }); 
  })
});

app.get("/about", function(req, res) {
  res.render("about", {
    firstParagraph: aboutContent
  });
});

app.get("/contact", function(req, res) {
  res.render("contact", {
    firstParagraph: contactContent
  });
});

app.get("/login", function(req, res){
  res.render("login");
});

// app.get("/register", function(req, res){
//   res.render("register");
// });

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/compose",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/compose");
  });

app.get("/compose", function(req, res){
  if (req.isAuthenticated()){
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

// // Able to register user
// app.post("/register", function (req, res) {

//   User.register({username: req.body.username}, req.body.password, function(err, user){
//     if (err) {
//       console.log(err);
//       res.redirect("/register");
//     } else {
//       passport.authenticate("local")(req, res, function(){
//         res.redirect("/compose");
//       });
//     }
//   });

// });

// Able to receive login input
app.post("/login", function (req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/compose");
      });
    }
  });

});

// Receive Post blog post

app.post("/compose", function (req, res) {
  const newBlog = new Blog ({
    title: req.body.postTitleBlog,
    content: req.body.postContentBlog
  });
  
  newBlog.save(function(err){
    if (!err){
      res.redirect("/");
    }
  });

});

// Get individual posts - per page

app.get("/posts/:postId", function(req, res) {
  const requestedPostId = req.params.postId;

  Blog.findOne({_id: requestedPostId}, function(err, newPost){
    res.render("post", {
      title: newPost.title,
      content: newPost.content
    });
  });

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, function(){
  console.log("Server started on port 8000");
});
