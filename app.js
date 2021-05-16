import express, { json } from "express";
import passport from "passport";
import "./db/mongoose.js";
import User from "./models/users.js"
import { ensureLoggedIn } from "connect-ensure-login"
import FacebookStrategy from "passport-facebook"
import morgan from "morgan"
import cookieParser from "cookie-parser";
import expressSession from 'express-session'
import dotenv from 'dotenv'
dotenv.config()

const app = express();
const port = process.env.port || 3000;


//middleware to log HTTP requests and errors
app.use(morgan(function(tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res), "\n",
        "Chrome:", tokens.req(req, res, 'sec-ch-ua'), "\n",
        "Mozilla:", tokens.req(req, res, 'User-Agent'), '\n',
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms'
    ].join(' ')
}));
app.use(cookieParser());
app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));


app.use(express.json())
app.use(express.json({ extended: false }))

app.use(passport.initialize());
app.use(passport.session())



//Take the userid and serialize it 
passport.serializeUser(function(user, done) {
    console.log("Here" + user)
    done(null, user.id);
});

passport.deserializeUser(async(userid, done) => {
    try {
        const user = await User.findById(userid)
        done(null, user);
    } catch (error) {
        done(error.message, null);

    }

});


app.set('view engine', 'ejs')
app.use(express.static('views'))




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
            return cb(undefined, user)
        } catch (E) {
            try {

                if (E.message === "No User") {
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
                cb(new Error(`Database error ${E.message}`, null))

            }

        }
    }));



// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());



app.get("/home", ensureLoggedIn(), (req, res, next) => {
    res.send("Here")
})


app.use((req, res, next) => {
    res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.get('/login', async function(req, res, next) {

    res.render('form.ejs', {
        title: "login"
    })
})

app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect("/home")
    });





app.get('/dashboard', ensureLoggedIn(), (req, res, next) => {
    res.render('profile.ejs', { user: req.user, title: "Profile" })

})

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
});



app.listen(port, () => console.log(`Example app listening on port ${port}!`));
passport.authenticate({ session: false })