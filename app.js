//jshint esversion:6

require('dotenv').config();
const express = require("express");

const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const https = require("https");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const _ = require('lodash');

// Main text content per page

const homeStartingContent = "I am Rico, a tech product manager that loves to build cool things. Helping companies to build best-in-class products is what I do.";
const aboutContent = "Hopefully my home page didn't spoil too much information about myself... Well, I am Rico Ngo, 30 summers of age, and a Dutchman with Chinese & Vietnamese roots. In my daily life, I am a tech product manager at Company Webcast, a Euronext Company, where I get to build a great product team and the next-gen webcast platform.";
const aboutContent2 = "I started my career in Product Management at eVision Industry Software (now Enablon/Wolters Kluwer), where I got to manage my own product team and created a product from scratch in collaboration with the biggest Oil & Gas companies that was ranked as the best safety tool by Verdantix. After that, I decided to pursue a start-up adventure as the product lead of Woov, a live music platform. Despite the pandemic, we enhanced the platform that enabled monetization of our business model through digital payment & music right tracking. "
const aboutContent3 = "Living in Rotterdam, I graduated from Rotterdam School of Management (RSM) with a MSc Strategic Management degree and I had the possibility to study in the United States & China as an intern. With this knowledge, I decided to pursue a career in Product Management, which I still love to do till this day.";
const contactContent = "If you're interested in my work or what I can do, please reach out to me. As you can see in the picture, I have a state-of-the-art office to receive your messages. Leave a message below or contact me on other platforms.";
const blogsContent = "On this page, I will share my product knowledge, experiences, and insights with the community through blogs. The audience is aimed at people who are new at product management and want to pursue their career in this field. Content is still WIP. Sign up your email here and I will update you on my first articles."
const portfolioContent = "I have worked on different products & projects in my Product Management career. Most of them I did it as a Product Manager, Product Lead, and Product Owner at start-ups and scale-ups orgs. Besides building great products, I'm also passionated about building great product teams. If you want my advise or work with me, don't hesitate to contact me."

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true 
}));
app.use(express.static(__dirname + '/public'));

// Setup session for active logins
app.use(session({
  secret: "Our little secret weehee.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// passport.use(new GoogleStrategy({
//   clientID: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
//   callbackURL: "https://rico.ngo/auth/google/compose",
//   userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
// },
// function(accessToken, refreshToken, profile, cb) {
//   // console.log(profile);

//   User.findOrCreate({ googleId: profile.id }, function (err, user) {
//     return cb(err, user);
//   });
// }
// ));

// Connect with MongoDB Atlas
mongoose.connect("mongodb+srv://RicoN:test12345@cluster0.g1jhf.mongodb.net/RicoPersonalWebsite?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

// Create DB schema to login - master user

const userSchema = new mongoose.Schema({
  email: String,
  password: String
  // googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Add Mongoose user model based on this schema
const User = new mongoose.model("MasterUser", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
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

app.get("/", function (req, res) {

  Blog.find({}, function (err, blogs) {
    res.render("home", {
      firstParagraph: homeStartingContent,
      blogContents: blogs
    });
  })
});

app.get("/about", function (req, res) {
  res.render("about", {
    firstParagraph: aboutContent,
    secondParagraph: aboutContent2,
    thirdParagraph: aboutContent3
  });
});

app.get("/contact", function (req, res) {
  res.render("contact", {
    firstParagraph: contactContent
  });
});

app.get("/blogs", function (req, res) {

  Blog.find({}, function (err, blogs) {
    res.render("blogs", {
      firstParagraph: blogsContent,
      blogContents: blogs
    });
  })
});

app.get("/portfolio", function (req, res) {
  res.render("portfolio", {
    firstParagraph: portfolioContent
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

// render portfolio pages

app.get("/portfolio/barriermanagement", function (req, res) {
  res.render("portfolioitems/barriermanagement");
});

app.get("/portfolio/riskbowtie", function (req, res) {
  res.render("portfolioitems/riskbowtie");
});

app.get("/portfolio/livemusicplatform", function (req, res) {
  res.render("portfolioitems/livemusicplatform");
});


app.get("/portfolio/digitalpayment", function (req, res) {
  res.render("portfolioitems/digitalpayment");
});

app.get("/portfolio/musicrighttool", function (req, res) {
  res.render("portfolioitems/musicrighttool");
});

app.get("/portfolio/webcastplatform", function (req, res) {
  res.render("portfolioitems/webcastplatform");
});

app.get("/portfolio/selfservice", function (req, res) {
  res.render("portfolioitems/selfservice");
});


// blogs mail letter sign up

app.get("/blogs/signupsuccess", function (req, res) {
  res.render("signupsuccess");
});

app.get("/blogs/signupfailure", function (req, res) {
  res.render("signupfailure");
});

// app.get("/register", function(req, res){
//   res.render("register");
// });

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

// app.get("/auth/google",
//   passport.authenticate('google', { scope: ["profile"] })
// );

// app.get("/auth/google/compose",
//   passport.authenticate('google', { failureRedirect: "/login" }),
//   function(req, res) {
//     // Successful authentication, redirect to secrets.
//     res.redirect("/compose");
//   });

app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
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

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/compose");
      });
    }
  });

});

// Receive Post blog post

app.post("/compose", function (req, res) {
  const newBlog = new Blog({
    title: req.body.postTitleBlog,
    content: req.body.postContentBlog
  });

  newBlog.save(function (err) {
    if (!err) {
      res.redirect("/");
    }
  });

});

// Get individual posts - per page

app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;

  Blog.findOne({
    _id: requestedPostId
  }, function (err, newPost) {
    res.render("post", {
      title: newPost.title,
      content: newPost.content
    });
  });

});


// Sign-up with mailchimp

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/blogs")
})

app.post("/blogs", function (req, res) {
  const firstName = req.body.fName
  const lastName = req.body.lName
  const email = req.body.email

  const data = {
    members: [
      {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName
        }
      }
    ]
  }

  const jSONData = JSON.stringify(data);

  const url = "https://us7.api.mailchimp.com/3.0/lists/3197007214"
  const mailChimpAccount = "FromRicoByMail:"
  const mailChimpKey1 = "7cbac0b48cf969e566"
  const mailChimpKey2 = "6958c369d993d0-us7"

  const options = {
    method: "POST",
    auth: mailChimpAccount+mailChimpKey1+mailChimpKey2
}

  const request = https.request(url, options, function(response) {

    if (response.statusCode === 200) {
         res.render("signupsuccess");
        } else {
          res.render("signupfailure");
        }

    response.on("data", function(data){
      console.log(JSON.parse(data));
    })
  })

  request.write(jSONData);
  request.end();

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, function () {
  console.log("Server started on port 8000");
});
