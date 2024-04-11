const getAllTntCards = "SELECT * FROM tntyugioh";
const getAllAmazonCards = "SELECT * FROM amazonyugioh";
const getUserWatchList = "SELECT * FROM userwatchlist WHERE email = $1";
const insertUserWatchList =
  "INSERT INTO userwatchlist(id, email, watchlist) VALUES(DEFAULT, $1, $2) RETURNING *";
const updateUserWatchList =
  "UPDATE userwatchlist SET watchlist = $1 WHERE email = $2 RETURNING *";

module.exports = {
  getAllTntCards,
  getAllAmazonCards,
  getUserWatchList,
  insertUserWatchList,
  updateUserWatchList,
};
