const express = require("express");
const cors = require("cors");
const pool = require("./db");
const queries = require("./queries");
const PORT = 4400;
const app = express();

const fs = require("fs");

app.use(cors());
app.use(express.json());

app.get("/tntcards", (req, res) => {
  const currentPage = req.query.currentPage;
  const keywords = req.query.keywords;
  const maxPrice = req.query.maxPrice;
  const selectedPerPage = req.query.selectedPerPage;

  const stopIndex = currentPage * selectedPerPage;
  const startIndex = (currentPage - 1) * selectedPerPage;

  pool.query(queries.getAllTntCards, (error, result) => {
    if (error) throw error;
    let tntCards = result.rows;

    if (keywords) {
      tntCards = tntCards.filter((item) =>
        item.name.toLowerCase().includes(keywords.toLowerCase())
      );
    }

    if (maxPrice) {
      tntCards.forEach((card, index) => {
        let hasLowPrice = false;

        card.prices.forEach((price) => {
          let parsed = parseFloat(JSON.parse(price).price.substring(1));
          if (parsed < maxPrice) {
            hasLowPrice = true;
          }
        });
        if (!hasLowPrice) {
          tntCards.splice(index, 1);
        }
      });
    }

    const perPageCards = tntCards.slice(startIndex, stopIndex);
    res.status(200).json({ items: perPageCards, total: tntCards.length });
  });
});

app.get("/amazoncards", (req, res) => {
  const currentPage = req.query.currentPage;
  const keywords = req.query.keywords;
  const maxPrice = req.query.maxPrice;
  const selectedPerPage = req.query.selectedPerPage;

  const stopIndex = currentPage * selectedPerPage;
  const startIndex = (currentPage - 1) * selectedPerPage;

  pool.query(queries.getAllAmazonCards, (error, result) => {
    if (error) throw error;
    let amazonCards = result.rows;

    if (keywords) {
      amazonCards = amazonCards.filter((item) =>
        item.name.toLowerCase().includes(keywords.toLowerCase())
      );
    }

    if (maxPrice) {
      amazonCards.forEach((card, index) => {
        let hasLowPrice = false;

        card.prices.forEach((price) => {
          let parsed = parseFloat(JSON.parse(price).price.substring(1));
          if (parsed < maxPrice) {
            hasLowPrice = true;
          }
        });
        if (!hasLowPrice) {
          amazonCards.splice(index, 1);
        }
      });
    }

    const perPageCards = amazonCards.slice(startIndex, stopIndex);
    res.status(200).json({ items: perPageCards, total: amazonCards.length });
  });
});

app.get("/allcards", (req, res) => {
  const currentPage = req.query.currentPage;
  const keywords = req.query.keywords;
  const maxPrice = parseFloat(req.query.maxPrice);
  const selectedPerPage = req.query.selectedPerPage;

  const stopIndex = currentPage * selectedPerPage;
  const startIndex = (currentPage - 1) * selectedPerPage;

  pool.query(queries.getAllTntCards, (err1, res1) => {
    if (err1) throw err1;
    const tntCards = res1.rows;
    pool.query(queries.getAllAmazonCards, (err2, res2) => {
      if (err2) throw err2;
      const amazonCards = res2.rows;

      let allCards = [...tntCards, ...amazonCards];
      for (let i = 0; i < allCards.length - 1; i++) {
        allCards[i].prices = [...new Set(allCards[i].prices)];
      }

      if (keywords) {
        allCards = allCards.filter((item) =>
          item.name.toLowerCase().includes(keywords.toLowerCase())
        );
      }

      if (maxPrice) {
        allCards.forEach((card, index) => {
          let hasLowPrice = false;

          card.prices.forEach((price) => {
            let parsed = parseFloat(JSON.parse(price).price.substring(1));
            if (parsed < maxPrice) {
              hasLowPrice = true;
            }
          });
          if (!hasLowPrice) {
            allCards.splice(index, 1);
          }
        });
      }

      const perPageCards = allCards.slice(startIndex, stopIndex);
      res.status(200).json({ items: perPageCards, total: allCards.length });
    });
  });
});

app.get("/userwatchlist", (req, res) => {
  const email = req.query.email.toLowerCase();
  const values = [email];

  //try get user watch list
  pool.query(queries.getUserWatchList, values, (error, result) => {
    if (error) throw error;
    //if user doesnt have a watch list, create one
    if (result.rowCount < 1) {
      let watchlist = [];
      let testValues = [email, watchlist];
      //insert new watch list row tied to user email
      pool.query(queries.insertUserWatchList, testValues, (error2, result2) => {
        if (error2) throw error2;
        const newValues = [email];
        //re get user watch list and send result
        pool.query(queries.getUserWatchList, newValues, (error3, result3) => {
          if (error3) throw error3;
          res
            .status(200)
            .json({ items: result3.rows, length: result3.rowCount });
        });
      });
    } else {
      res.status(200).json({ items: result.rows, length: result.rowCount });
    }
  });
});

app.post("/userwatchlist", (req, res) => {
  const email = req.body.email.toLowerCase();
  const item = req.body.item;

  let values1 = [email];

  pool.query(queries.getUserWatchList, values1, (error1, result1) => {
    let currentList = [];
    if (error1) throw error1;
    currentList = result1.rows[0].watchlist;
    //res.status(200).json({ message: "posted", current: currentList });

    currentList.push(item);
    let values2 = [currentList, email];
    pool.query(queries.updateUserWatchList, values2, (error2, result2) => {
      if (error2) throw error2;
      res.status(200).json({ items: result2.rows[0].watchlist });
    });
  });
});

app.post("/userwatchlist/delete", (req, res) => {
  const email = req.body.email.toLowerCase();
  const item = req.body.item;

  const values = [email];

  pool.query(queries.getUserWatchList, values, (error, result) => {
    if (error) throw error;
    currentList = result.rows[0].watchlist;
    if (currentList.indexOf(item) != -1) {
      currentList.splice(currentList.indexOf(item), 1);
      let newValues = [currentList, email];
      pool.query(queries.updateUserWatchList, newValues, (error2, result2) => {
        if (error2) throw error2;
        res.status(200).json({ items: result2.rows[0].watchlist });
      });
    } else {
      res.status(200).json({ message: "item didnt exist" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
