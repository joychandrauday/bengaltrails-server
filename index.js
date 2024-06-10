require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");


const allowedOrigins = [];
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      'https://bengaltrails.web.app',
      "https://cardoctor-bd.firebaseapp.com",
    ]
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nsswhi9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    // collections in database
    const guidesCollection = client.db("bengalTrails").collection("guides");
    const packageCollection = client.db("bengalTrails").collection("packages");
    const typeCollection = client.db("bengalTrails").collection("tourTypes");
    const travelStoriesCollection = client
      .db("bengalTrails")
      .collection("travelStories");
    const bookingCollection = client.db("bengalTrails").collection("bookings");
    const usersCollection = client.db("bengalTrails").collection("users");
    const bucketCollection = client.db("bengalTrails").collection("bucketList");
    // collections in database

    // jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign( user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h"
      });
      res.send({ token });
    });
    // jwt api
    //varify token
    const varifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access." });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        function (err, decoded) {
          if (err) {
            return res.status(401).send({ message: "forbidden access." });
          }
          req.decoded = decoded;
          next();
        }
      );
    };
    //varify token

    // guide apis
    app.get("/guides", async (req, res) => {
      const cursor = guidesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return;
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.post("/guides", async (req, res) => {
      const user = req.body;
      const result = await guidesCollection.insertOne(user);
      res.send(result);
    });
    app.patch("/guides/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateFields = req.body;
      try {
        const result = await guidesCollection.updateOne(query, { $set: updateFields });
    
        if (result.modifiedCount === 1) {
          res.status(200).json({ message: "Guide details updated successfully" });
        } else {
          res.status(404).json({ message: "Guide not found" });
        }
      } catch (error) {
        console.error("Error updating guide details:", error);
        res.status(500).json({ error: "An error occurred while updating guide details" });
      }
    });
    app.get("/guide", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { guideEmail: req.query?.email };
      }
      const result = await guidesCollection.findOne(query);
      res.send(result);
    });

    app.get("/guide/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const guide = await guidesCollection.findOne(query);
      if (!guide) {
        return res.status(404).json({ message: "Guide not found" });
      }
      // Calculate average rating
      const reviews = guide.reviews || [];
      const totalRating = reviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      const averageRating =
        reviews.length > 0 ? totalRating / reviews.length : 0;
      res.json({ ...guide, averageRating, reviews });
    });

    app.post("/guide/:id/reviews", async (req, res) => {
      const id = req.params.id;
      const { rating, review, userName, userImage } = req.body;
      try {
        const query = { _id: new ObjectId(id) };
        const guide = await guidesCollection.findOne(query);
        if (!guide) {
          return res.status(404).json({ message: "Guide not found" });
        }
        await guidesCollection.updateOne(query, {
          $push: {
            reviews: {
              rating,
              review,
              userName,
              userImage,
              _id: new ObjectId(),
            },
          },
        });
        res.json({ success: true });
      } catch (error) {
        console.error("Error submitting review:", error);
        res
          .status(500)
          .json({ error: "An error occurred while submitting the review" });
      }
    });
    // guide apis

    //packages
    app.get("/packages", async (req, res) => {
      const cursor = packageCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/packages", async (req, res) => {
      const package = req.body;
      const result = await packageCollection.insertOne(package);
      res.send(result);
    });
    app.get("/package/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await packageCollection.findOne(query);
      res.send(result);
    });
    // app.get("/package/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await packageCollection.findOne(query);
    //   res.send(result);
    // });

    //packages

    //bucketList
    app.get("/bucket-list", async (req, res) => {
      const cursor = bucketCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/bucket-list", async (req, res) => {
      const bucket = req.body;
      const result = await bucketCollection.insertOne(bucket);
      res.send(result);
    });
    app.get("/bucket-lists", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
      const result = await bucketCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/bucket-lists/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bucketCollection.deleteOne(query);
      res.send(result);
    });
    //bucketList

    //blogs
    app.get("/travelStories", async (req, res) => {
      const cursor = travelStoriesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/story/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await travelStoriesCollection.findOne(query);
      res.send(result);
    });
    app.post("/story", async (req, res) => {
      const story = req.body;
      const result = await travelStoriesCollection.insertOne(story);
      res.send(result);
    });
    //blogs

    //tourtypes
    app.get("/tourTypes", async (req, res) => {
      const cursor = typeCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/tourType/:name", async (req, res) => {
      try {
        const type = req.params.name;
        const query = { tourType: type };
        const result = await packageCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    });
    //tourtypes

    //bookings
    app.get("/bookings", async (req, res) => {
      const cursor = bookingCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/booking", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { touristEmail: req.query?.email };
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });
    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const { status } = req.body;
      // const result=await bookingCollection.deleteOne(query)
      const updateDoc = {
        $set: {
          status,
        },
      };
      const result = await bookingCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    //bookings

    //users
    app.get("/all-users", varifyToken, async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return;
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/user", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query?.email };
      }
      const result = await usersCollection.findOne(query);
      res.send(result);
    });
    //users

    //userHooks
    app.get("/users/admin/:email", varifyToken, async (req, res) => {
      const email = req.params.email;
      // if (email !== req.decoded.email) {
      //   return res.status(403).send({ message: "Unauthorized access" });
      // }
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "unauthoirized access." });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const admin = user?.role === "admin";
      res.send({ admin });
    });
    app.get("/users/guide/:email", async (req, res) => {
      const email = req.params.email;
      // if (email !== req.decoded.email) {
      //   return res.status(403).send({ message: "Unauthorized access" });
      // }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const guide = user?.role === "guide";
      res.send({ guide, email });
    });
    app.get("/reqGuide", async (req, res) => {
      // const email = req.params.email;
      // if (email !== req.decoded.email) {
      //   return res.status(403).send({ message: "Unauthorized access" });
      // }
      const query = { reqGuide: true };
      const users = await usersCollection.find(query).toArray();
      // const guide = user?.role === "guide";
      res.send(users);
    });
    //userHooks

    //guide request
    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const { role, guide, reqGuide } = req.body;

      const updateDoc = {
        $set: {
          role,
          guide,
          reqGuide,
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    //guide request

    //assigned tour
    app.get("/booking-by-guide/:email", async (req, res) => {
      const email = req.params.email;
      const query = { guideEmail: email };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/booking/count", async (req, res) => {
      try {
        const { email } = req.query;

        // Query the database to count the bookings for the specified user
        const count = await Booking.countDocuments({ touristEmail: email });

        res.json({ count });
      } catch (error) {
        console.error("Error fetching booking count:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
    //assigned tour

    

    // Send a ping to confirm a successful connection
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("the trails server is running...");
});
app.listen(port, () => {
  console.log(`trails server is running on port ${port}`);
});
