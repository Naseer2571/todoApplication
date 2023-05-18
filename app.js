let express = require("express");
let app = express();
app.use(express.json());

let { open } = require("sqlite");

let path = require("path");
let dbpath = path.join(__dirname, "covid19India.db");

let sqlite3 = require("sqlite3");
let db = null;

let initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`DB ERROR:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.get("/states/", async (request, response) => {
  let sendStates = `SELECT 
                          *
                        FROM 
                        state`;

  let statesRes = await db.all(sendStates);

  function changeIntoCamelCase(dbObj) {
    return {
      stateId: dbObj.state_id,
      stateName: dbObj.state_name,
      population: dbObj.population,
    };
  }

  let resultArray = statesRes.map((eachItem) => changeIntoCamelCase(eachItem));
  response.send(resultArray);
});

app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  let sendState = `SELECT 
                          *
                        FROM 
                        state
                        WHERE 
                         state_id = ${stateId}`;

  let statesRes = await db.get(sendState);
  function changeIntoCamelCase(dbObj) {
    return {
      stateId: dbObj.state_id,
      stateName: dbObj.state_name,
      population: dbObj.population,
    };
  }
  let result = changeIntoCamelCase(statesRes);
  response.send(result);
});

app.post("/districts/", async (request, response) => {
  let districtsObj = request.body;

  let { districtName, stateId, cases, cured, active, deaths } = districtsObj;

  let postDist = `INSERT INTO 
                      district(district_name,state_id,cases,cured,active,deaths)
                      
                      VALUES ('${districtName}',
                                ${stateId},
                                ${cases},
                                ${cured},
                                ${active},
                                ${deaths})`;

  let dbRes = await db.run(postDist);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let sendDist = `SELECT 
                          *
                        FROM 
                        district
                        WHERE 
                         district_id = ${districtId}`;

  let distRes = await db.get(sendDist);
  function changeIntoCamelCase(dbObj) {
    return {
      districtId: dbObj.district_id,
      districtName: dbObj.district_name,
      stateId: dbObj.state_id,
      cases: dbObj.cases,
      cured: dbObj.cured,
      active: dbObj.active,
      deaths: dbObj.deaths,
    };
  }
  let result = changeIntoCamelCase(distRes);
  response.send(result);
});

app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;

  let deleteDist = `DELETE FROM 
                        district 
                        WHERE 
                         district_id = ${districtId}`;

  await db.run(deleteDist);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let updateDistObj = request.body;
  let { districtName, stateId, cases, cured, active, deaths } = updateDistObj;
  let updateDist = `UPDATE 
                        district 
                        SET 
                         district_name = '${districtName}',
                         state_id = ${stateId},
                         cases = ${cases},
                         cured = ${cured},
                         active = ${active},
                         deaths = ${deaths}
                        WHERE 
                          distict_id = ${districtId}
                         `;

  await db.run(updateDist);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;
  console.log(stateId);
  let getdistricts = `SELECT 
                            sum(cases) AS totalCases,
                            sum(cured) AS totalCured,
                            sum(active) AS totalActive,
                            sum(deaths) AS totalDeaths
                          FROM 
                          district 
                          WHERE 
                          state_id = ${stateId}`;
  let result = await db.get(getdistricts);
  response.send({ result });
});

module.exports = app;
