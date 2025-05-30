const express = require("express");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const path = require("path");
const app =express();
require('dotenv').config();


app.use(session({
  secret: process.env.SESSION_SECRET,  // Use a strong secret in production
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 day
    httpOnly: true,
    secure: false, // Set true only with HTTPS
  }
}));



app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());


app.use('/', require('./routes/userRoute'))

app.listen(8000,()=>console.log("server started"));