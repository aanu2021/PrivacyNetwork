import express, { Request, Response } from "express";
import User, { UserDocument } from "../models/models";
import bcrypt from "bcryptjs";
import axios from "axios";
import { z } from "zod";
import requireLogin from "../middlewares/requireLogin";
import HttpStatusCode from "../types/HttpStatusCode";

const userRouter = express.Router();
const LOCATION_BACKEND_URI = process.env.LOCATION_BACKEND_URI;

interface CustomRequest extends Request {
  user?: UserDocument;
}

// Friend a user
userRouter.put(
  "/follow",
  requireLogin,
  async (req: CustomRequest, res: Response) => {
    try {
      /**
       * @openapi
       * '/api/follow':
       *  put:
       *     tags:
       *     - User
       *     summary: Add an user in your friendlist through their user id
       *     requestBody:
       *      required: true
       *      content:
       *        application/json:
       *           schema:
       *              type: object
       *              properties:
       *                userID:
       *                  type: string
       *                  description: ID of the user, to be added in your friend list
       *                  default: "6112345678901234456789012"
       *     responses:
       *       200:
       *         description: Success
       *         content:
       *          application/json:
       *           schema:
       *              type: object
       *              properties:
       *                success:
       *                  type: boolean
       *       404:
       *         description: User not found
       */

      const toFollow = req.body.userID;
      const wantToFollow = req.user?._id?.toString();

      await User.findByIdAndUpdate(toFollow, {
        $addToSet: { friends: wantToFollow },
      });

      await User.findByIdAndUpdate(wantToFollow, {
        $addToSet: { friends: toFollow },
      });

      return res.status(HttpStatusCode.OK).json({ success: true });
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatusCode.UNPROCESSABLE_ENTITY)
        .json({ error: "Something went wrong..." });
    }
  },
);

// Unfriend a user
userRouter.put(
  "/unfollow",
  requireLogin,
  async (req: CustomRequest, res: Response) => {
    try {
      /**
       * @openapi
       * '/api/unfollow':
       *  put:
       *     tags:
       *     - User
       *     summary: Remove an user from your friendlist through their user id
       *     requestBody:
       *      required: true
       *      content:
       *        application/json:
       *           schema:
       *              type: object
       *              properties:
       *                userID:
       *                  type: string
       *                  description: ID of the user, to be removed from your friend list
       *                  default: "6112345678901234456789012"
       *     responses:
       *       200:
       *         description: Success
       *         content:
       *          application/json:
       *           schema:
       *              type: object
       *              properties:
       *                success:
       *                  type: boolean
       *       404:
       *         description: User not found
       */
      const toFollow = req.body.userID;
      const wantToFollow = req.user?._id?.toString();

      await User.findByIdAndUpdate(
        toFollow,
        {
          $pull: { friends: wantToFollow },
        },
        {
          new: true,
        },
      );

      await User.findByIdAndUpdate(
        wantToFollow,
        {
          $pull: { friends: toFollow },
        },
        {
          new: true,
        },
      );

      return res.status(HttpStatusCode.OK).json({ success: true });
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatusCode.UNPROCESSABLE_ENTITY)
        .json({ error: "Something went wrong..." });
    }
  },
);

// Fetch user details
userRouter.get(
  "/user/:id",
  requireLogin,
  async (req: Request, res: Response) => {
    try {
      /**
       * @openapi
       * '/api/user/{id}':
       *  get:
       *     tags:
       *     - User
       *     summary: Get specific user by their user id
       *     parameters:
       *      - name: id
       *        in: path
       *        description: The id of the user
       *        required: true
       *     responses:
       *       200:
       *         description: Success
       *         content:
       *          application/json:
       *           schema:
       *              $ref: '#/components/schemas/User'
       *       404:
       *         description: User not found
       */
      const { id } = req.params;
      const currUser = await User.findOne({ _id: id }).select("-password");
      res.status(HttpStatusCode.OK).json({ user: currUser });
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatusCode.UNPROCESSABLE_ENTITY)
        .json({ error: "Something went wrong..." });
    }
  },
);

// Fetch all users' details
userRouter.get(
  "/allusers",
  requireLogin,
  async (req: Request, res: Response) => {
    try {
      /**
       * @openapi
       * '/api/allusers':
       *  get:
       *     tags:
       *     - User
       *     summary: Get details of all the users
       *     responses:
       *       200:
       *         description: Success
       *         content:
       *          application/json:
       *           schema:
       *              $ref: '#/components/schemas/AllUsers'
       *       404:
       *         description: User not found
       */
      const allUsers = await User.find({}).populate(
        "friends",
        "_id name username Photo",
      );
      res.status(HttpStatusCode.OK).json({ users: allUsers });
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatusCode.UNPROCESSABLE_ENTITY)
        .json({ error: "Something went wrong..." });
    }
  },
);

// Save profile picture of users inside MongoDB (through cloudinary)
userRouter.put(
  "/uploadProfilePic",
  requireLogin,
  async (req: CustomRequest, res: Response) => {
    try {
      await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: { Photo: req.body.pic },
        },
        {
          new: true,
        },
      );
      res.status(HttpStatusCode.OK).json({ success: true });
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatusCode.UNPROCESSABLE_ENTITY)
        .json({ error: "Something went wrong..." });
    }
  },
);

const setPropertiesRequest = z.object({
  id: z.string(),
  age: z.number(),
  gender: z.string(),
  college: z.string(),
  visibility: z.boolean(),
});

// Putting the age, gender, college, visibility properties of a user
userRouter.put(
  "/setProperties",
  requireLogin,
  async (req: CustomRequest, res: Response) => {
    try {
      /**
       * @openapi
       * '/api/setProperties':
       *  put:
       *     tags:
       *     - User
       *     summary: Set age, gender, college, visibility for an user
       *     requestBody:
       *      required: true
       *      content:
       *        application/json:
       *           schema:
       *              type: object
       *              properties:
       *                age:
       *                  type: number
       *                  description: Age of the user
       *                  default: 22
       *                gender:
       *                  type: string
       *                  description: Gender of the user
       *                  enum: [Male, Female, Non Binary]
       *                  default: Male
       *                college:
       *                  type: string
       *                  description: College of the user
       *                  enum: [Jadavpur University, Calcutta University, Presidency University, Kalyani University]
       *                  default: Jadavpur University
       *                visibility:
       *                  type: boolean
       *                  description: Visibility mode of the user
       *                  default: true
       *     responses:
       *       200:
       *         description: Success
       *         content:
       *          application/json:
       *           schema:
       *              type: object
       *              properties:
       *                success:
       *                  type: boolean
       *       404:
       *         description: User not found
       */

      const { age, gender, college, visibility } = req.body;

      if (!age || !gender || !college || visibility === null) {
        return res
          .status(HttpStatusCode.UNPROCESSABLE_ENTITY)
          .json({ error: "Please fill up all the properties..." });
      }

      const setPropertiesPayload = req.body;
      setPropertiesPayload.id = req.user?.postgresId;
      const parsedPayload =
        setPropertiesRequest.safeParse(setPropertiesPayload);
      if (!parsedPayload.success) {
        res.status(HttpStatusCode.LENGTH_REQUIRED).json({
          msg: "You sent the wrong inputs from ts-backend server. The postgresId could not be found",
        });
        return;
      }

      const bearerToken = process.env.BACKEND_INTERCOMMUNICATION_SECRET || "";
      const saltForLoc = bcrypt.genSaltSync(10);
      const hashedBearerToken = bcrypt.hashSync(bearerToken, saltForLoc);
      const response = await axios.put(
        `${LOCATION_BACKEND_URI}/api/setProperties`,
        setPropertiesPayload,
        {
          headers: {
            Authorization: `Bearer ${hashedBearerToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status !== HttpStatusCode.OK) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          msg: "User details could not be updated in LOC Postgres server. Response is generated from ts-backend server",
        });
      }

      await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: { age },
        },
        {
          new: true,
        },
      );

      await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: { gender },
        },
        {
          new: true,
        },
      );

      await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: { college },
        },
        {
          new: true,
        },
      );

      await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: { visibility },
        },
        {
          new: true,
        },
      );

      return res.status(HttpStatusCode.OK).json({ success: true });
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatusCode.UNPROCESSABLE_ENTITY)
        .json({ error: "Something went wrong in the ts-backend server" });
    }
  },
);

const setLocationRequest = z.object({
  id: z.string(),
  lat: z.number(),
  lng: z.number(),
});

// Putting the new location of a user
userRouter.put(
  "/setLocation",
  requireLogin,
  async (req: CustomRequest, res: Response) => {
    try {
      /**
       * @openapi
       * '/api/setLocation':
       *  put:
       *     tags:
       *     - User
       *     summary: Set location for an user
       *     requestBody:
       *      required: true
       *      content:
       *        application/json:
       *           schema:
       *              type: object
       *              properties:
       *                lat:
       *                  type: number
       *                  description: Latitude of the user
       *                  default: 22.123456
       *                lng:
       *                  type: number
       *                  description: Longitude of the user
       *                  default: 88.654321
       *     responses:
       *       200:
       *         description: Success
       *         content:
       *          application/json:
       *           schema:
       *              type: object
       *              properties:
       *                success:
       *                  type: boolean
       *       404:
       *         description: User not found
       */

      const setLocationPayload = req.body;
      setLocationPayload.id = req.user?.postgresId;
      const parsedPayload = setLocationRequest.safeParse(setLocationPayload);
      if (!parsedPayload.success) {
        res.status(HttpStatusCode.LENGTH_REQUIRED).json({
          msg: "You sent the wrong inputs from ts-backend server. The postgresId could not be found",
        });
        return;
      }

      const bearerToken = process.env.BACKEND_INTERCOMMUNICATION_SECRET || "";
      const saltForLoc = bcrypt.genSaltSync(10);
      const hashedBearerToken = bcrypt.hashSync(bearerToken, saltForLoc);
      const response = await axios.put(
        `${LOCATION_BACKEND_URI}/api/setLocation`,
        setLocationPayload,
        {
          headers: {
            Authorization: `Bearer ${hashedBearerToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status !== HttpStatusCode.OK) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          msg: "User locations could not be updated in LOC Postgres server. Response is generated from ts-backend server",
        });
      }

      return res.status(HttpStatusCode.OK).json({ success: true });
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatusCode.UNPROCESSABLE_ENTITY)
        .json({ error: "Something went wrong in the ts-backend server" });
    }
  },
);

export default userRouter;
