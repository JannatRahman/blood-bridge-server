const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());



const uri = process.env.MONGO_DB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });

    const db = client.db('blood-bridge');
    const donationCollection = db.collection('donations');
    const paymentCollection = db.collection('payments');
    const requestCollection = db.collection('requests');
    const userCollection = db.collection('user');
    const fundingCollection = db.collection('funding');


    app.get('/api/donation/:email', async (req, res) => {
      const { email } = req.params;;
      const result = await donationCollection.findOne({ email });
      res.send(result);
    })




    //  DONATION REQUESTS
    app.get('/api/donation-request', async (req, res) => {
      const bloodGroup = req.query.bloodGroup;
      const districts = req.query.recipientDistrict;
      const upazila = req.query.recipientUpazila;

      const query = {};
      if (bloodGroup) {
        query.bloodGroup = bloodGroup;
      }
      if (districts) {
        query.recipientDistrict = districts;
      }
      if (upazila) {
        query.recipientUpazila = upazila;
      }
      const cursor = donationCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });


    app.get('/api/single-request/:id', async (req, res) => {
      const { id } = req.params;
      console.log(req.params)
      const query = { _id: new ObjectId(id) };
      const result = await donationCollection.findOne(query);
      res.send(result);
    });

    app.patch('/api/single-request/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await donationCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { status } },
          { returnDocument: "after" }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });



    // DONOR API

    app.get('/api/my-request/:email', async (req, res) => {
      const { email } = req.params;
    // pagination
    const {page =1, limit=10} = req.query;
    const skip = (Number(page) - 1) * Number(limit)


      const result = await donationCollection.find({
        requesterEmail: email
      }).skip(skip).limit(Number(limit)).toArray();
      const totalData = await donationCollection.countDocuments({requesterEmail: email})
      const totalPage = Math.ceil(totalData/Number(limit))

      res.send({data: result, page: Number(page), totalPage});
    })

    app.post('/api/create-request', async (req, res) => {
      const data = req.body;
      console.log(data);

      const result = await donationCollection.insertOne({
        ...data,
        status: 'pending'
      })

      res.send(result);
    });

    app.patch('/api/edit-request/:id', async (req, res) => {
      const { id } = req.params;

      const updateData = req.body;
      console.log(updateData);
      const result = await donationCollection.updateOne(

        { _id: new ObjectId(id) },
        {
          $set: {

            recipientName: updateData.name,
            bloodGroup: updateData.bloodGroup,
            recipientDistrict: updateData.districts,
            donationDate: updateData.date
          },
        }
      );
      console.log(result);
      res.send(result);
    });

    app.delete('/api/delete-request/:id', async (req, res) => {
      const { id } = req.params;
      const result = await donationCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    })

    // payment api
    app.patch('/api/users/payment-successful/:email', async (req, res) => {
      const { email } = req.params;
      const result = await userCollection.updateOne(
        { email }
      );
      res.send(result);
    });


    //  funding api

    // 1. SAVE a new donation
    app.post('/api/add-fund', async (req, res) => {
      try {
        const { name, amount, date } = req.body;
        const newDonation = {
          name,
          amount: parseFloat(amount),
          date: date || new Date().toISOString().split('T')[0]
        };
        const result = await fundingCollection.insertOne(newDonation);
        res.send({ ...newDonation, _id: result.insertedId });
      } catch (error) {
        console.error("Error saving donation:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });


    app.get('/api/get-funds', async (req, res) => {
      try {
        const result = await fundingCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching funds:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // volunteer api
    app.get('/api/get-request', async (req, res) => {
      // const {} = req.params;
      const result = await donationCollection.find().toArray();
      res.send(result)
    })

    // users api

    app.get('/api/all-users', async (req, res) => {
      try {
        const userCollection = db.collection('user');
        const users = await userCollection.find({}).toArray();
        res.status(200).send(users);
      } catch (error) {
        console.error("Error fetching users from database:", error);
        res.status(500).send({ message: "Internal Server Error", error: error.message });
      }
    });


    app.patch('/api/all-users/:id/status', async (req, res) => {
      try {
        const userId = req.params.id;
        const { isBlocked } = req.body;
        const userCollection = db.collection('user');
        const result = await userCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { isBlocked: isBlocked } }
        );
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "User not found" });
        }
        res.status(200).send({ message: "User status updated successfully", isBlocked });
      } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).send({ message: "Internal Server Error", error: error.message });
      }
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});