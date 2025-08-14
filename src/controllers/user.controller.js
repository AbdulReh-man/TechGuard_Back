import { User } from "../models/user.model.js";
import sendEmail from "../../utils/emailConfig.js";
import jwt from "jsonwebtoken";
import { uploadoncloudinary } from "../../utils/cloudinary_service.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

//User Registration

const registerUser = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    fullname,
    password,
    address,
    role,
    serviceProviderDetails,
  } = req.body;

  try {
    // Validate fields
    console.log(
      username,
      email,
      fullname,
      password,
      address,
      role,
      serviceProviderDetails
    );

    const { street, city, zipcode, country } = address;
    if (!street || !city || !zipcode || !country) {
      return res.status(400).json({ message: "All address fields are required!" });
    }
    if (!username || !email || !fullname || !password || !role || !address) {
      return res.status(400).json({ message: "test All fields are required!" });
    }

    // if (role === "service-provider" && !serviceProviderDetails) {
    //   return res
    //     .status(400)
    //     .json({ message: "test service-provider details are required!" });
    // }

    // Check if user already exists
    let existingUser = await User.findOne({ username: req.body.username });
 if (existingUser) {
  throw new ApiError(409,"Username already taken");
 }
     existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists!" });
    }
    
    // Extract the local path of the avatar file using optional chaining
    const avatarLocalPath = req.files?.avatar[0]?.path;

    console.log("avatar upload on server", avatarLocalPath);

    // Extract the local path of the documents file
    if (role === "service-provider") {
      const documentsLocalPath = req.files?.document[0]?.path;
      console.log("in", documentsLocalPath);

      // Ensure a documents file is provided; otherwise, throw a 400 error
      if (role === "service-provider" && !documentsLocalPath) {
        throw new ApiError(400, "Documents file is required");
      }

      // Upload the documents file to Cloudinary

      var document = await uploadoncloudinary(documentsLocalPath);

      // Ensure the documents upload was successful; otherwise, throw an error
      if (!document) {
        throw new ApiError(400, "Documents upload failed");
      }
    }

    // Ensure an avatar file is provided; otherwise, throw a 400 error
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }

    // Upload the avatar file to Cloudinary
    const avatar = await uploadoncloudinary(avatarLocalPath);

    // Ensure the avatar upload was successful; otherwise, throw an error
    if (!avatar) {
      throw new ApiError(400, "Avatar upload failed");
    }

    // The avatar and documents are now successfully uploaded

    // Create user
    const newUser = new User({
      username,
      email,
      fullname,
      avatar: avatar.url,
      password,
      address: {
        street: address.street,
        city: address.city,
        zipCode: address.zipcode,
        country: address.country,
      },
      role,
      serviceProviderDetails:
        role === "service-provider"
          ? {
              // servicesOffered: serviceProviderDetails.servicesOffered,
              document: document.url, // Save uploaded document URL
              // rating: serviceProviderDetails.rating,
            }
          : undefined,
      isVerified: false,
    });

    // Save user to the database
    await newUser.save();
    console.log("user created");

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: newUser._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // Send verification email
    const verificationUrl = `http://localhost:9000/api/techguard/users/verify/${verificationToken}`;
    const emailText = `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Hello ${newUser.username},</h2>
    <p>Please verify your email address by clicking the button below:</p>
    <a href="${verificationUrl}" style="
      display: inline-block;
      padding: 12px 20px;
      margin: 20px 0;
      background-color: #28a745;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    ">Verify Email</a>
    <p>If you didn't create this account, you can safely ignore this email.</p>
    <p>Thank you!<br/>TechGuard Team</p>
  </div>
`;


    await sendEmail(newUser.email, "Email Verification", emailText);

    res.status(201).json({
      message:
        "User registered successfully! Please verify your email to activate your account.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});

//  Handle Email Verification
const sendVerificationMail = asyncHandler(async (req, res) => {
  try {
    const { token } = req.params;

    // Verify the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.userId);
    console.log("user", user);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token!" });
    }

    if (user.isVerified == true) {
      return res.status(201).send("Email is alredy verified.");
    }
    // Update the user as verified
    user.isVerified = true;
    await user.save();

    return res
      .status(200)
      .send("Email verified successfully. You can now log in.");
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

//// For generate accestoken and Refresh token to assign to user session cookies while user login

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        username: user.username,
        fullname: user.fullname,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
    );

    const refreshToken = jwt.sign(
      {
        _id: user._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }

    );

    user.refreshtoken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error(error);
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

////login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("email", email);
    console.log("password", password);
    if (!email || !password) {
      throw new ApiError(400, "email and password is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    console.log("isPasswordValid", isPasswordValid);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid user credentials" });
      throw new ApiError(401, "Invalid user credentials");
      
    }

    if (!user.isVerified) {
      // Generate verification token
      const verificationToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h" }
      );
      console.log("VerificationToken===", verificationToken);
      // Send verification email
      const verificationUrl = `http://localhost:9000/api/users/Verify/${verificationToken}`;
      const emailText = `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Hello ${user.username},</h2>
    <p>Please verify your email address by clicking the button below:</p>
    <a href="${verificationUrl}" style="
      display: inline-block;
      padding: 12px 20px;
      margin: 20px 0;
      background-color: #28a745;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    ">Verify Email</a>
    <p>If you didn't create this account, you can safely ignore this email.</p>
    <p>Thank you!<br/>TechGuard Team</p>
  </div>
`


      await sendEmail(user.email, "Email Verification", emailText);
      return res.json(
        new ApiResponse(
          201,
          null,
          "Please verify your email to activate your account"
        )
      );
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshtoken  -serviceProviderDetails "
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged In Successfully"
        )
      );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});

////logout User
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshtoken: "", // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

//Refresh User Access Token which is Expired
const refresh_The_AccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshtoken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

//Reset or Change User password which is currently logged in
const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "All fields are required");
    }
    const user = await User.findById(req.user._id);

    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid Password");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Change Successfully"));
  } catch (error) {
    throw new ApiError(401, Error);
  }
});

//Forget Password
//Send Reset Password Email
const sendUserPasswordResetEmail= async(req,res)=>{
  const {email}= req.body
  if(email){
      const user= await User.findOne({email:email})
      if(user){
          const Secret= user._id + process.env.JWT_Secrete_key 
          const token = jwt.sign({userID:user._id},Secret,{expiresIn:"15m"})
          const link= `http://localhost:9000/api/techguard/users/reset_password/${user._id}/${token}`
          console.log(link)
          

          const emailText = `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Hello ${user.username},</h2>
    <p>Please reset your password clicking the button below:</p>
    <a href="${link}" style="
      display: inline-block;
      padding: 12px 20px;
      margin: 20px 0;
      background-color: #28a745;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    ">Reset Password</a>
    <p>If you didn't make this request, you can safely ignore this email.</p>
    <p>Thank you!<br/>TechGuard Team</p>
  </div>
`


      await sendEmail(user.email, "Password Reset", emailText);
      return res.json(
        new ApiResponse(
          201,
          null,
          "Please check your email to reset your password"
        )
      );
      res.send({"status":"success","message":"Password Reset Email Sent........Please check your email","info":info})
      }else{
          res.send({"status":"failed","message":"Email does not exists"})
      }
  }else{
      res.send({"status":"failed","message":"All fields are required"})
  }
}


const userPasswordReset= async(req,res)=>{
  const {password,password_confirmation}= req.body
  const {id,token}= req.params
  const user= await User.findById(id)
  const new_secret= user._id + process.env.JWT_Secrete_key
  try {
      jwt.verify(token,new_secret)
      if(password && password_confirmation){
          if(password !== password_confirmation){
              res.send({"status":"failed","message":"Password and Password Confirmation does not match"})
          }else{
              // const salt= await bcrypt.genSalt(10)
              // const new_hashPassword= await bcrypt.hash(password,salt)
              // await userModel.findByIdAndUpdate(user._id,{$set:{password:new_hashPassword}})

              const user = await User.findById(id);
              user.password = password;
              await user.save({ validateBeforeSave: false });
              res
              .status(200)
              .json(new ApiResponse(200, {}, "Password Reset Successfully"));
          }
      }else{
          res.send({"status":"failed","message":"All fields are required"})
      }
  } catch (error) {
      console.log(error)
      res.send({"status":"failed","message":""})
  }
}



//Update user Details
const UpdateDetails = asyncHandler(async () => {});

export {
  registerUser,
  sendVerificationMail,
  loginUser,
  logoutUser,
  refresh_The_AccessToken,
  changeCurrentUserPassword,
  sendUserPasswordResetEmail,
  userPasswordReset
};
