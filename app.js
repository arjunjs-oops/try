import express, { json } from "express";
import passport from "passport";
import "./db/mongoose.js";
import User from "./models/users.js"
import FacebookStrategy from "passport-facebook"
const app = express();
const port = process.env.port || 3000;
import dotenv from 'dotenv'
dotenv.config()

app.use(express.json())
app.use(express.json({ extended: false }))
    // Enable swagger-stats middleware in express app, passing swagger specification as option 
app.set('view engine', 'ejs')
app.use(express.static('views'))
app.use(json());
app.use(passport.initialize());


app.use(passport.session())
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get("/home", passport.authenticate('facebook', { session: true }), (req, res, next) => {
    res.send("Here")
})
passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'email', 'picture.type(large)'],
        enableProof: true
    },
    async function(accessToken, refreshToken, profile, cb) {
        try {
            const user = await User.findOne({ facebookId: profile.id, email: profile.emails[0].value })
            if (!user) throw new Error("No User")
            console.log(user)
            return cb(undefined, user)
        } catch (E) {
            try {

                if (E.message === "No User") {
                    console.log({...profile })
                    const user = new User({
                        facebookId: profile.id,
                        displayName: profile.displayName,
                        email: profile.emails[0].value,
                        photo: profile.photos[0].value
                    })
                    await user.save();
                    return cb(undefined, user)
                }
            } catch (E) {
                console.log(E.message)
                cb(new Error(`Database error ${E.message}`, null))

            }

        }
    }));



app.use((req, res, next) => {
    res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.get("/login", (req, res) => res.render('form.ejs', {
    title: "login"
}));

app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
        console.log("User " + req.user)
            // Successful authentication, redirect home.
        res.render('profile.ejs', { user: req.user, title: "Home" })
    });





app.get('/dashboard', passport.authenticate('facebook', { session: true }), (req, res, next) => {
    res.render('profile.ejs', { user: req.user, title: "Profile" })

})

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
});

app.get('/swagger-stats', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swStats);
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
passport.authenticate({ session: false })