require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://bookersden.netlify.app",
      "https://bookersdenfinalvariation.web.app",
    ],
    credentials: true,
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

    // jwt api

    // book apis
    app.get("/guides", async (req, res) => {
      const cursor = guidesCollection.find();
      const result = await cursor.toArray();
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
    app.get("/package/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await packageCollection.findOne(query);
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      // if (email !== req.decoded.email) {
      //   return res.status(403).send({ message: "Unauthorized access" });
      // }
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
      res.send({ guide });
    });
    // app.post("/allbooks", async (req, res) => {
    //   const newBook = req.body;
    //   const result = await bookCollection.insertOne(newBook);
    //   res.send(result);
    // });

    // // librarian management
    // app.post("/librarians", async (req, res) => {
    //   const newLibrarian = req.body;
    //   const result = await librarianCollection.insertOne(newLibrarian);
    //   res.send(result);
    // });

    // app.get("/librarians", async (req, res) => {
    //   const cursor = librarianCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // app.get("/librarian/:email", async (req, res) => {
    //   const librarian = await librarianCollection.findOne({
    //     email: req.params.email,
    //   });

    //   res.json(librarian);
    // });

    // // librarian management

    // app.get("/borrowed-books", async (req, res) => {
    //   const result = await borrowedBookCollection.find().toArray();
    //   res.send(result);
    // });

    // app.get("/borrowed-book/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await borrowedBookCollection.findOne(query);
    //   res.send(result);
    // });

    // app.get("/borrowed-books-of", logger, varifyToken, async (req, res) => {
    //   if (req.user.email === req.query.email) {
    //     let query = {};
    //     if (req.query?.email) {
    //       query = { email: req.query.email };
    //     }
    //     const result = await borrowedBookCollection.find(query).toArray();
    //     res.send(result);
    //   }else{
    //     return res.status(403).send({message:'forbidden access.'})
    //   }

    // });

    // app.post("/borrowed-books", async (req, res) => {
    //   const borrowedBook = req.body;
    //   const result = await borrowedBookCollection.insertOne(borrowedBook);
    //   res.send(result);
    // });

    // app.patch("/book/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const { book_numbers } = req.body;
    //   // const result=await bookingCollection.deleteOne(query)
    //   const updateDoc = {
    //     $set: {
    //       book_numbers,
    //     },
    //   };
    //   const result = await bookCollection.updateOne(query, updateDoc);
    //   res.send(result);
    // });
    // app.delete("/book/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await bookCollection.deleteOne(query);
    //   res.send(result);
    // });

    // app.put("/book/update/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    //   const options = { upsert: true };
    //   const updatedDes = req.body;
    //   const book = {
    //     $set: {
    //       image: updatedDes.image,
    //       book_name: updatedDes.book_name,
    //       genre: updatedDes.genre,
    //       book_numbers: updatedDes.book_numbers,
    //       short_description: updatedDes.short_description,
    //       author: updatedDes.author,
    //       rating: updatedDes.rating,
    //     },
    //   };
    //   const result = await bookCollection.updateOne(filter, book, options);
    //   res.send(result);
    // });

    // app.delete("/borrowed-book/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await borrowedBookCollection.deleteOne(query);
    //   res.send(result);
    // });

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
