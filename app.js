let express = require("express")
let app = express() ;

app.use(express.static("./"));
app.listen(8080, ()=>{
  console.log("listening on port 8080") ;
})
