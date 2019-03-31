const getTestURL = () => {
    if (process.env.HEROKU_APP_NAME) {
      return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
    }
    else {
      return `http://localhost:${process.env.PORT || 8443}`;
    }
}
const sfdxTimeout = 1000 * 60 * 25;

export { getTestURL, sfdxTimeout }


