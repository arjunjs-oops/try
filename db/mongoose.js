import mongoose from "mongoose";
const { connect } = mongoose;
connect(process.env.mongoDbKey, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
}).catch((e) => {
    console.log(e);
});