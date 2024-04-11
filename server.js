const express = require("express");
const cors = require("cors");
const pool = require("./db");
const queries = require("./queries");
const PORT = 4400;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/tntcards", (req, res) => {
  const currentPage = req.query.currentPage;
  const keywords = req.query.keywords;
  const priceLow = req.query.priceLow;
  const priceHigh = req.query.priceHigh;
  const selectedPerPage = req.query.selectedPerPage;

  pool.query(queries.getAllTntCards, (error, result) => {
    if (error) throw error;
    const stopIndex = currentPage * selectedPerPage;
    const startIndex = (currentPage - 1) * selectedPerPage;
    if (keywords) {
      const filtered = result.rows.filter((item) =>
        item.name.toLowerCase().includes(keywords.toLowerCase())
      );
      const perPageCards = filtered.slice(startIndex, stopIndex);
      res.status(200).json({
        items: perPageCards,
        total: result.rowCount,
        message: keywords,
      });
    } else {
      const perPageCards = result.rows.slice(startIndex, stopIndex);
      res.status(200).json({ items: perPageCards, total: result.rowCount });
    }
  });
});

app.get("/amazoncards", (req, res) => {
  const currentPage = req.query.currentPage;
  const keywords = req.query.keywords;
  const priceLow = req.query.priceLow;
  const priceHigh = req.query.priceHigh;
  const selectedPerPage = req.query.selectedPerPage;
  pool.query(queries.getAllAmazonCards, (error, result) => {
    if (error) throw error;
    const stopIndex = currentPage * selectedPerPage;
    const startIndex = (currentPage - 1) * selectedPerPage;
    if (keywords) {
      const filtered = result.rows.filter((item) =>
        item.name.toLowerCase().includes(keywords.toLowerCase())
      );
      const perPageCards = filtered.slice(startIndex, stopIndex);
      res.status(200).json({
        items: perPageCards,
        total: result.rowCount,
        message: keywords,
      });
    } else {
      const perPageCards = result.rows.slice(startIndex, stopIndex);
      res.status(200).json({ items: perPageCards, total: result.rowCount });
    }
  });
});

app.get("/allcards", (req, res) => {
  const currentPage = req.query.currentPage;
  const keywords = req.query.keywords;
  const priceLow = req.query.priceLow;
  const priceHigh = req.query.priceHigh;
  const selectedPerPage = req.query.selectedPerPage;

  const stopIndex = currentPage * selectedPerPage;
  const startIndex = (currentPage - 1) * selectedPerPage;
  pool.query(queries.getAllTntCards, (err1, res1) => {
    if (err1) throw err1;
    const tntCards = res1.rows;
    pool.query(queries.getAllAmazonCards, (err2, res2) => {
      if (err2) throw err2;
      const amazonCards = res2.rows;
      let joinedList = [];

      //compare names between lists and copy over any prices from amazoncard to tntcard,
      //remove amazoncard from list and push tntcard to joined list
      for (let i = 0; i < tntCards.length - 1; i++) {
        for (let j = 0; j < amazonCards.length - 1; j++) {
          let shortenedName = amazonCards[j].name.substring(0, 30);
          if (tntCards[i].name.includes(shortenedName)) {
            tntCards[i].prices.push(...amazonCards[j].prices);
            tntCards[i].link = [tntCards[i].link, amazonCards[j].link];
            amazonCards.splice(j, 1);
          }
        }
        joinedList.push(tntCards[i]);
      }

      joinedList = [...joinedList, ...amazonCards];

      //remove duplicate prices
      for (let i = 0; i < joinedList.length - 1; i++) {
        joinedList[i].prices = [...new Set(joinedList[i].prices)];
      }
      let priceFiltered = [];

      if (priceLow && priceHigh) {
        priceFiltered = joinedList.filter((card) => {
          card.prices.forEach((priceObj) => JSON.parse(priceObj));

          for (let i = 0; i < card.prices.length - 1; i++) {
            if (
              Number(card.prices[i].price) > Number(priceLow) &&
              Number(card.prices[i].price) < Number(priceHigh)
            ) {
              return card;
            }
          }
        });
      }

      if (keywords) {
        if (priceFiltered.length > 1) {
          priceFiltered.filter((card) =>
            card.name.toLowerCase().includes(keywords.toLowerCase())
          );
          const perPageCards = filtered.slice(startIndex, stopIndex);
          res.status(200).json({
            items: perPageCards,
            total: priceFiltered.length,
            message: keywords,
          });
        } else {
          const filtered = joinedList.filter((item) =>
            item.name.toLowerCase().includes(keywords.toLowerCase())
          );
          const perPageCards = filtered.slice(startIndex, stopIndex);
          res.status(200).json({
            items: perPageCards,
            total: filtered.length,
            message: keywords,
          });
        }
      } else if (priceLow && priceHigh) {
        const perPageCards = priceFiltered.slice(startIndex, stopIndex);
        res
          .status(200)
          .json({ items: perPageCards, total: priceFiltered.length });
      } else {
        const perPageCards = joinedList.slice(startIndex, stopIndex);
        res.status(200).json({ items: perPageCards, total: joinedList.length });
      }
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
