require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const passport = require("passport");
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate')

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));


app.use(session({
    secret: "this is our little secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

var name = "";

mongoose.connect("mongodb://localhost:27017/login-db", { useNewUrlParser: true });

const googleSchema = new mongoose.Schema({
    googleId: String
})


googleSchema.plugin(passportLocalMongoose);
googleSchema.plugin(findOrCreate);

const GoogleUser = new mongoose.model("GoogleUser", googleSchema);

passport.use(GoogleUser.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    GoogleUser.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        callbackURL: "http://localhost:3000/auth/google/login"
    },
    function(accessToken, refreshToken, profile, cb) {
        name = profile.displayName
        GoogleUser.findOrCreate({ googleId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));

const fbSchema = new mongoose.Schema({
    facebookId: String
})

fbSchema.plugin(passportLocalMongoose);
fbSchema.plugin(findOrCreate);

const FbUser = new mongoose.model("FbUser", fbSchema);

passport.use(FbUser.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    FbUser.findById(id, function(err, user) {
        done(err, user);
    });
});
passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/login"
    },
    function(accessToken, refreshToken, profile, cb) {
        name = profile.displayName
        FbUser.findOrCreate({ facebookId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", function(req, res) {
    res.render("signin", { message: "" });
})

app.get("/login", function(req, res) {
    res.render("signin", { message: "" });
})

app.get("/auth/google/login",
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/loggedin');
    });

app.get("/auth/google", passport.authenticate('google', {

    scope: ['profile']

}));

app.get('/auth/facebook/login',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect("/loggedin");
    });

app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: 'public_profile'
}));


app.get("/sign-up", function(req, res) {
    res.render("signup");
})

app.get("/loggedin", function(req, res) {
    res.render("loggedin", { username: name });
})

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})
const User = new mongoose.model("User", userSchema);

app.post("/signUp", function(req, res) {
    User.findOne({ email: req.body.email }, function(err, founduser) {
        if (founduser) {
            res.render("signin", { message: "email is registered,please signin." });
        } else {
            if (err) {
                console.log(err);
            } else {
                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password
                });
                newUser.save(function(err) {
                    if (!err) {
                        res.render("signin", { message: "you have successfully registered,please signin." })
                    } else {
                        console.log(err);
                    }
                })
            }
        }
    })
})

app.post("/signIn", function(req, res, err) {
    User.findOne({ email: req.body.email }, function(err, founduser) {
        if (founduser.password === req.body.password) {
            res.render("loggedin", { username: founduser.name })
        } else {
            if (err) {
                console.log(err);
            } else {
                res.render("signin", { message: "Incorrect password" });
            }
        }
    });

})

app.listen(3000, function(req, res) {
    console.log("server started at port 3000");
})