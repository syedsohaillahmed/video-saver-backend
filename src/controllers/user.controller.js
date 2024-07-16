import { asyncHandler } from "../utils/asyncHandler.js";


const registerUser = asyncHandler( async (req, res)=>{
    res.status(200).json({
        message:"ok"
    })

    const {userName, email, password, fullName} = req.body
    console.log("userName:", userName)
    console.log("email:", email)
    console.log("password:", password)

} )

export {registerUser}