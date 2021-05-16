import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config();
const { connect } = mongoose;
connect(process.env.mongoDbKey, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
}).catch((e) => {
    console.log(e);
});