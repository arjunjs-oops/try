import mongoose from "mongoose"


const userSchema = new mongoose.Schema({
    facebookId: String,
    displayName: String,
    photo: String,
    email: String

})

const User = mongoose.model('Users', userSchema)
export default User