import {
  OWGames,
  OWGamesEvents,
  OWHotkeys
} from "@overwolf/overwolf-api-ts";

import { AppWindow } from "../AppWindow";
import { kHotkeys, kWindowNames, kGamesFeatures } from "../consts";


import WindowState = overwolf.windows.WindowStateEx;

let roster_orange = [];
let roster_blue = [];
let playerTeam = "";
let roundEnded = false;
let rosterUpdated = false;
let playerLoaded = 0;
let orangeScore = "0";
let blueScore = "0";

// The window displayed in-game while a game is running.
// It listens to all info events and to the game events listed in the consts.ts file
// and writes them to the relevant log using <pre> tags.
// The window also sets up Ctrl+F as the minimize/restore hotkey.
// Like the background window, it also implements the Singleton design pattern.
class InGame extends AppWindow {
  private static _instance: InGame;
  private _gameEventsListener: OWGamesEvents;
  private _eventsLog: HTMLElement;
  private _infoLog: HTMLElement;
  private _icons: HTMLElement;

  private constructor() {
    super(kWindowNames.inGame);

    this._eventsLog = document.getElementById('eventsLog');
    this._infoLog = document.getElementById('infoLog');
    this._icons = document.getElementById('player_iconsTable');

    this.setToggleHotkeyBehavior();
    this.setToggleHotkeyText();
  }

  public static instance() {
    if (!this._instance) {
      this._instance = new InGame();
    }

    return this._instance;
  }

  public async run() {
    const gameClassId = await this.getCurrentGameClassId();

    const gameFeatures = kGamesFeatures.get(gameClassId);

    if (gameFeatures && gameFeatures.length) {
      this._gameEventsListener = new OWGamesEvents(
        {
          onInfoUpdates: this.onInfoUpdates.bind(this),
          onNewEvents: this.onNewEvents.bind(this)
        },
        gameFeatures
      );

      this._gameEventsListener.start();
    }
  }

  private onInfoUpdates(info) {

    let results = [];

    if (! info.players) {
      return;
    }
    // console.log(info.players)

    Object.keys(info.players).forEach(k => {
      console.log("Type Of: ", typeof(info.players[k]));
      console.log(info.players[k]);

      // set score
      if (info.match) {
        console.log(info.match.score);
        let score = JSON.parse(info.match.score);

        orangeScore = score.orange;
        blueScore = score.blue;
        console.log("Orange Score: " + orangeScore)
        console.log("Blue Score: " + blueScore)
      }

      // reset update

      const sourceDoc = JSON.parse(info.players[k]);
      if (sourceDoc) {   

        console.log("Deaths: " + sourceDoc.deaths)

        if (sourceDoc.team == "Orange") {
          const newDoc = {
            // roster: "roster_" + roster_orange.length,
            name: sourceDoc.name,
            team: sourceDoc.team,
            operator: sourceDoc.operator,
            deaths: sourceDoc.deaths,
            health: sourceDoc.health,
            is_local: sourceDoc.is_local,
            img: `/img/operators/${sourceDoc.operator}.svg`
            // img: `/img/operators_2024/${sourceDoc.operator}.svg`
          };  
          
          if (sourceDoc.is_local == true) {
            console.log("Player team is: Orange!")
            playerTeam = "Orange"
          }
          
          var indexOrange = 0
          var foundIndexOrange = false

          while (indexOrange < roster_orange.length) {
            if (roster_orange[indexOrange].name == sourceDoc.name) {
              roster_orange[indexOrange] = newDoc
              foundIndexOrange = true
            }
            indexOrange ++;
          }

          if (foundIndexOrange == false) {
            roster_orange.push(newDoc);
          }
        }

        if (sourceDoc.team == "Blue") {
          const newDoc = {
            // roster: "roster_" + (roster_blue.length + 5),
            name: sourceDoc.name,
            team: sourceDoc.team,
            operator: sourceDoc.operator,
            deaths: sourceDoc.deaths,
            health: sourceDoc.health,
            is_local: sourceDoc.is_local,
            img: `/img/operators/${sourceDoc.operator}.svg`
            // img: `/img/operators_2024/${sourceDoc.operator}.svg`
          };

          if (sourceDoc.is_local == true) {
            console.log("Player team is: Blue!")
            playerTeam = "Blue"
          }

          var indexBlue = 0
          var foundIndexBlue = false

          while (indexBlue < roster_blue.length) {
            console.log(roster_blue[indexBlue])
            if (roster_blue[indexBlue].name == sourceDoc.name) {
              roster_blue[indexBlue] = newDoc
              foundIndexBlue = true
            }
            indexBlue ++;
          }

          if (foundIndexBlue == false) {
            roster_blue.push(newDoc);
          }
        }

        console.log("Blue: " + JSON.stringify(roster_blue));
        console.log("Orange: " + JSON.stringify(roster_orange));
      }
    });

    console.log("playerteam: " + playerTeam)

    if (playerTeam == "Orange") {
      for (let i = 0; i < roster_orange.length; i++) {
        results.push(roster_orange[i])
      }
  
      for (let i = 0; i < roster_blue.length; i++) {
        results.push(roster_blue[i])
      }
    }

    if (playerTeam == "Blue") {
      for (let i = 0; i < roster_blue.length; i++) {
        results.push(roster_blue[i])
      } 

      for (let i = 0; i < roster_orange.length; i++) {
        results.push(roster_orange[i])
      }
    }

    console.log("Results: " + JSON.stringify(results))
    console.log("Updated: " + rosterUpdated)
  
    if (info.match_info) {
      if (info.match_info.map_id == null) {
          roster_orange = []
          roster_blue = []
          console.log("Roster Reset - Player in Lobby!")
      }
    }

    // check if operator loading finished
    for (let i = 0; i < results.length; i++) {
      if (results[i].team != playerTeam) {
        if (i < 6) {
          console.log("not matching " + i)
          if (results[i-1].operator != 0) {
            console.log("finished operator loading")
            if (rosterUpdated == false) {
              this.updateIcons(this._icons, results);
              rosterUpdated = true;
            }
          }
        }
      }
    }

    // check if round ended
    for (let i = 0; i < results.length; i++) {
      if (results[i].operator == 0) {
        if (rosterUpdated == true) {
          rosterUpdated = false;
          console.log("Triggered update! - Round End")
        }
      }
    }
    // check if round started
    if (results[0].operator != 0) {
      if (rosterUpdated == false) {
        this.updateIcons(this._icons, results);
        rosterUpdated = true;
        console.log("Triggered update! - Round Start")
      }
    }

    // this should be always called
    this.updateHealth(this._icons, results);
  }

  // Special events will be highlighted in the event log
  private onNewEvents(e) {
    const shouldUpdate = e.events.some(event => {
      switch (event.name) {
        case 'kill':
        case 'death':
        case 'assist':
        case 'level':
        case 'matchStart':
        case 'match_start':
        case 'matchEnd':
        case 'match_end':
        case 'roundStart':
        case 'roundEnd':
          return true;
      }

      return false
    });
  }

  // check if player is a defender
  private isDefender(op) {
    switch (op) {
      case 256:
      case 512:
      case 257:
      case 769:
      case 258:
      case 514:
      case 771:
      case 1027:
      case 772:
      case 1028:
      case 517:
      case 518:
      case 519:
      case 520:
      case 521:
      case 522:
      case 267:
      case 524:
      case 270:
      case 526:
      case 527:
      case 528:
      case 273:
      case 275:
      case 276:
      case 534:
      case 279:
      case 281:
      case 1046:
      case 27:
      case 28:
      case 791:
        return true;
    }

    return false
  };

  // Displays the toggle minimize/restore hotkey in the window header
  private async setToggleHotkeyText() {
    const gameClassId = await this.getCurrentGameClassId();
    const hotkeyText = await OWHotkeys.getHotkeyText(kHotkeys.toggle, gameClassId);
    const hotkeyElem = document.getElementById('hotkey');
    hotkeyElem.textContent = hotkeyText;
  }

  // Sets toggleInGameWindow as the behavior for the Ctrl+F hotkey
  private async setToggleHotkeyBehavior() {
    const toggleInGameWindow = async (
      hotkeyResult: overwolf.settings.hotkeys.OnPressedEvent
    ): Promise<void> => {
      console.log(`pressed hotkey for ${hotkeyResult.name}`);
      const inGameState = await this.getWindowState();

      if (inGameState.window_state === WindowState.NORMAL ||
        inGameState.window_state === WindowState.MAXIMIZED) {
        this.currWindow.minimize();
      } else if (inGameState.window_state === WindowState.MINIMIZED ||
        inGameState.window_state === WindowState.CLOSED) {
        this.currWindow.restore();
      }
    }

    OWHotkeys.onHotkeyDown(kHotkeys.toggle, toggleInGameWindow);
  }

  private updateIcons(d: HTMLElement, data: Record<string, any>[]) {
    /*
      Functions draws player icons.
    */

    d.innerHTML = "";
    playerLoaded = 0;

    let currentTeam = playerTeam;
    data.forEach(player => {
      if (player.team != currentTeam) {

        // reset player loaded counter
        playerLoaded = 0;

        // once we get to first player on other team, draw elements in middle of hud 
        const playerIconSeparator = document.createElement("td");
        playerIconSeparator.setAttribute("class", "iconSeparator");

        const hudTeamLeft = document.createElement("div");
        hudTeamLeft.setAttribute("class", "teamLeft");
        playerIconSeparator.append(hudTeamLeft)

        const hudTeamSlantLeft = document.createElement("div");
        hudTeamSlantLeft.setAttribute("class", "teamSlantLeft");
        hudTeamLeft.append(hudTeamSlantLeft)

        const hudTeamScoreLeft = document.createElement("div");
        hudTeamScoreLeft.setAttribute("class", "teamScoreLeft");
        hudTeamLeft.append(hudTeamScoreLeft)

        const hudTeamScoreNumberLeft = document.createElement("div");
        hudTeamScoreNumberLeft.setAttribute("class", "teamScoreNumberLeft");

        if (player.team == "Blue") {
          hudTeamScoreNumberLeft.innerHTML = orangeScore
        }
        else {
          hudTeamScoreNumberLeft.innerHTML = blueScore
        }

        hudTeamScoreLeft.append(hudTeamScoreNumberLeft)

        const hudTeamIconLeft = document.createElement("img");

        const hudTeamRight = document.createElement("div");
        hudTeamRight.setAttribute("class", "teamRight");
        playerIconSeparator.append(hudTeamRight)

        const hudTeamSlantRight = document.createElement("div");
        hudTeamSlantRight.setAttribute("class", "teamSlantRight");
        hudTeamRight.append(hudTeamSlantRight)

        const hudTeamScoreRight = document.createElement("div");
        hudTeamScoreRight.setAttribute("class", "teamScoreRight");
        hudTeamRight.append(hudTeamScoreRight)

        const hudTeamScoreNumberRight = document.createElement("div");
        hudTeamScoreNumberRight.setAttribute("class", "teamScoreNumberRight");

        if (player.team == "Blue") {
          hudTeamScoreNumberRight.innerHTML = blueScore
        }
        else {
          hudTeamScoreNumberRight.innerHTML = orangeScore
        }

        hudTeamScoreRight.append(hudTeamScoreNumberRight)

        const hudTeamIconRight = document.createElement("img");

        let teamLeft = "";
        let teamRight = "";
        if (this.isDefender(player.operator) == true)
        {
          teamLeft = "attacker"
          teamRight = "defender"
          if (player.team == "Blue") {      
            hudTeamSlantLeft.setAttribute("style", `width: 13px; height: 63px; clip-path: polygon(0 0, 0% 100%, 100% 100%); background-color: #0a75c9;`);
            hudTeamSlantRight.setAttribute("style", `width: 13px; height: 63px; clip-path: polygon(100% 0, 0% 100%, 100% 100%); background-color: #e36809;`);
            hudTeamScoreNumberRight.setAttribute("style", `width: 100%; text-align: center; font-size: 53px; color: #e36809;`);
            hudTeamScoreNumberLeft.setAttribute("style", `width: 100%; text-align: center; font-size: 53px; color: #0a75c9;`);      
          }
          else {
            hudTeamSlantLeft.setAttribute("style", `width: 13px; height: 63px; clip-path: polygon(0 0, 0% 100%, 100% 100%); background-color: #e36809;`);
            hudTeamSlantRight.setAttribute("style", `width: 13px; height: 63px; clip-path: polygon(100% 0, 0% 100%, 100% 100%); background-color: #0a75c9;`);
            hudTeamScoreNumberRight.setAttribute("style", `width: 100%; text-align: center; font-size: 53px; color: #0a75c9;`);
            hudTeamScoreNumberLeft.setAttribute("style", `width: 100%; text-align: center; font-size: 53px; color:  #e36809;`);
          }
        }
        else {
          teamLeft = "defender"
          teamRight = "attacker"
          if (player.team == "Blue") {
            hudTeamSlantLeft.setAttribute("style", `width: 13px; height: 63px; clip-path: polygon(0 0, 0% 100%, 100% 100%); background-color: #0a75c9;`);
            hudTeamSlantRight.setAttribute("style", `width: 13px; height: 63px; clip-path: polygon(100% 0, 0% 100%, 100% 100%); background-color: #e36809;`);
            hudTeamScoreNumberRight.setAttribute("style", `width: 100%; text-align: center; font-size: 53px; color: #e36809;`);
            hudTeamScoreNumberLeft.setAttribute("style", `width: 100%; text-align: center; font-size: 53px; color: #0a75c9;`);  
          }
          else {
            hudTeamSlantLeft.setAttribute("style", `width: 13px; height: 63px; clip-path: polygon(0 0, 0% 100%, 100% 100%); background-color: #e36809;`);
            hudTeamSlantRight.setAttribute("style", `width: 13px; height: 63px; clip-path: polygon(100% 0, 0% 100%, 100% 100%); background-color: #0a75c9;`);
            hudTeamScoreNumberRight.setAttribute("style", `width: 100%; text-align: center; font-size: 53px; color: #0a75c9;`);
            hudTeamScoreNumberLeft.setAttribute("style", `width: 100%; text-align: center; font-size: 53px; color:  #e36809;`);
          }
        }

        hudTeamIconLeft.src = `/img/assets/${teamLeft}.svg`;
        hudTeamIconLeft.setAttribute("class", "teamIconLeft");
        hudTeamLeft.append(hudTeamIconLeft)

        hudTeamIconRight.src = `/img/assets/${teamRight}.svg`;
        hudTeamIconRight.setAttribute("class", "teamIconRight");
        hudTeamRight.append(hudTeamIconRight)

        d.appendChild(playerIconSeparator); 
        currentTeam = player.team;
      }

      const playerIconDiv = document.createElement("td");
      playerIconDiv.setAttribute("id", "bg/" + player.name);
      const playerIconImg = document.createElement("img");
      playerIconImg.setAttribute("class", "iconClass");
      playerIconDiv.appendChild(playerIconImg); 
      playerIconImg.src = `/img/operators/${player.operator}.svg`;
      // playerIconImg.src = `/img/operators_2024/${player.operator}.svg`;

      // health bar
      const playerIconHealthBar = document.createElement("div");
      playerIconHealthBar.setAttribute("class", "progressBar");
      playerIconDiv.appendChild(playerIconHealthBar); 

      const playerIconHealth = document.createElement("div");
      playerIconHealth.setAttribute("class", "progressBarHealth");
      playerIconHealth.setAttribute("id", player.name);
      playerIconHealthBar.appendChild(playerIconHealth);

      // health bar dividers
      const playerHealthDivider = document.createElement("div");
      playerHealthDivider.setAttribute("class", "progressBarDivider");
      playerIconHealthBar.appendChild(playerHealthDivider);
      
      const playerHealthDivider2 = document.createElement("div");
      playerHealthDivider2.setAttribute("class", "progressBarDivider2");
      playerIconHealthBar.appendChild(playerHealthDivider2);

      const playerHealthDivider3 = document.createElement("div");
      playerHealthDivider3.setAttribute("class", "progressBarDivider3");
      playerIconHealthBar.appendChild(playerHealthDivider3);

      // format player health

      let actualHealth = 0

      if ((player.health) > 120) {
        actualHealth = 100
      } 
      else {
        actualHealth = player.health - 20
      }

      console.log(actualHealth)
      
      playerIconHealth.setAttribute("style", `width: ${actualHealth}%;`)

      let iconOffset = ""

      // player icon offsets
      if (player.team == "Orange") {

        if (playerTeam == "Orange") {
          iconOffset = "position: relative; left: " + (4 - playerLoaded) * .69 + "rem;"
        }
        else {
          iconOffset = "position: relative; right: " + playerLoaded * .69 + "rem;"
        }

        playerLoaded ++;
        playerIconDiv.setAttribute("id", "bg/" + player.name + "/" + playerLoaded);
        playerIconDiv.setAttribute("style", `${iconOffset} filter: saturate(100%); opacity: 1; background-color: #e36809; clip-path: inset(6.7% 6.7% 0% 6.7% round 0%)`);
      }

      if (player.team == "Blue") {

        if (playerTeam == "Blue") {
          iconOffset = "position: relative; left: " + (4 - playerLoaded) * .69 + "rem;"
        }
        else {
          iconOffset = "position: relative; right: " + playerLoaded * .69 + "rem;"
        }

        playerLoaded ++;
        playerIconDiv.setAttribute("id", "bg/" + player.name + "/" + playerLoaded);
        playerIconDiv.setAttribute("style", `${iconOffset} filter: saturate(100%); opacity: 1; background-color: #0a75c9; clip-path: inset(6.7% 6.7% 0% 6.7% round 0%)`);
      }

      d.appendChild(playerIconDiv); 
    });
  };

  private updateHealth(d: HTMLElement, data: Record<string, any>[]) {
    /*
      Functions draws health bars.
    */

    console.log("Health update triggered")

    data.forEach(player => {
      let health = document.getElementById(player.name);
 
      console.log("playerTeam: " + playerTeam)
       let actualHealth = 0
 
       if ((player.health) > 120) {
         actualHealth = 100
       } 
       else {
         actualHealth = player.health - 20
       }
 
       console.log(actualHealth)
       
      if (player.deaths == 1) {
        console.log(player.name + " died!")
        if (player.team == playerTeam) {
          for (let i = 0; i <= 5; i++) {
            // console.log("bg_" + player.name + "_" + i)
            if (document.getElementById("bg/" + player.name + "/" + i) != null) {
              let playerData = ("bg/" + player.name + "/" + i)
              let playerDataSplit = playerData.split("/")
              console.log(playerDataSplit)
              
              let playerOffset = parseInt(playerDataSplit[2])-1
              let iconOffset = ""
    
              if (player.team == "Orange") {
    
                if (playerTeam == "Orange") {
                  iconOffset = "position: relative; left: " + (4 - playerOffset) * .69 + "rem;"
                }
                else {
                  iconOffset = "position: relative; right: " + playerOffset * .69 + "rem;"
                }
              }
    
              if (player.team == "Blue") {
    
                if (playerTeam == "Blue") {
                  iconOffset = "position: relative; left: " + (4 - playerOffset) * .69 + "rem;"
                }
                else {
                  iconOffset = "position: relative; right: " + playerOffset * .69 + "rem;"
                }
              }
    
              document.getElementById("bg/" + player.name + "/" + i).setAttribute("style", `${iconOffset} filter: saturate(50%); opacity: 0.85; background-color: #1818187c; clip-path: inset(6.7% 6.7% 0% 6.7% round 0%)`);
            }
          }
          health.setAttribute("style", `width: 0%;`) 
        }
        else if (player.deaths != 0) {
          if (player.deaths != 0) {
            for (let i = 0; i <= 5; i++) {
              // console.log("bg_" + player.name + "_" + i)
              if (document.getElementById("bg/" + player.name + "/" + i) != null) {
                let playerData = ("bg/" + player.name + "/" + i)
                let playerDataSplit = playerData.split("/")
                console.log(playerDataSplit)
                
                let playerOffset = parseInt(playerDataSplit[2])-1
                let iconOffset = ""
      
                if (player.team == "Orange") {
      
                  if (playerTeam == "Orange") {
                    iconOffset = "position: relative; left: " + (4 - playerOffset) * .69 + "rem;"
                  }
                  else {
                    iconOffset = "position: relative; right: " + playerOffset * .69 + "rem;"
                  }
                }
      
                if (player.team == "Blue") {
      
                  if (playerTeam == "Blue") {
                    iconOffset = "position: relative; left: " + (4 - playerOffset) * .69 + "rem;"
                  }
                  else {
                    iconOffset = "position: relative; right: " + playerOffset * .69 + "rem;"
                  }
                }
      
                document.getElementById("bg/" + player.name + "/" + i).setAttribute("style", `${iconOffset} filter: saturate(50%); opacity: 0.85; background-color: #1818187c; clip-path: inset(6.7% 6.7% 0% 6.7% round 0%)`);
              }
            }
            health.setAttribute("style", `width: 0%;`)
          }
        }
      }
      else {
        health.setAttribute("style", `width: ${actualHealth}%;`)
        for (let i = 0; i <= 5; i++) {
          if (document.getElementById("bg/" + player.name + "/" + i) != null) {
            let playerData = ("bg/" + player.name + "/" + i)
            console.log(playerData)
            let playerDataSplit = playerData.split("/")
            let playerOffset = parseInt(playerDataSplit[2])-1
            
            console.log("playerOffset: " + playerOffset)

            let iconOffset = ""

            if (player.team == "Orange") {
  
              if (playerTeam == "Orange") {
                iconOffset = "position: relative; left: " + (4 - playerOffset) * .69 + "rem;"
                document.getElementById("bg/" + player.name + "/" + (playerOffset+1)).setAttribute("style", `${iconOffset} filter: saturate(100%); opacity: 1; background-color: #0a75c9; clip-path: inset(6.7% 6.7% 0% 6.7% round 0%)`)
              }
              else {
                iconOffset = "position: relative; right: " + (playerOffset * .69) + "rem;"
                document.getElementById("bg/" + player.name + "/" + (playerOffset+1)).setAttribute("style", `${iconOffset} filter: saturate(100%); opacity: 1; background-color: #e36809; clip-path: inset(6.7% 6.7% 0% 6.7% round 0%)`)
                
              }
            }
  
            if (player.team == "Blue") {
  
              if (playerTeam == "Blue") {
                iconOffset = "position: relative; left: " + (4 - playerOffset) * .69 + "rem;"
                document.getElementById("bg/" + player.name + "/" + (playerOffset+1)).setAttribute("style", `${iconOffset} filter: saturate(100%); opacity: 1; background-color: #0a75c9; clip-path: inset(6.7% 6.7% 0% 6.7% round 0%)`)
                
              }
              else {
                iconOffset = "position: relative; right: " + (playerOffset * .69) + "rem;"
                document.getElementById("bg/" + player.name + "/" + (playerOffset+1)).setAttribute("style", `${iconOffset} filter: saturate(100%); opacity: 1; background-color: #e36809; clip-path: inset(6.7% 6.7% 0% 6.7% round 0%)`)
              }
            }
            
            console.log("bg/" + player.name + "/" + (playerOffset+1))
          }
        }
      }
      console.log("Health width: " + health.offsetWidth)
    });
  };

  // Appends a new line to the specified log
  private logLine(log: HTMLElement, data, highlight) {
    const line = document.createElement('pre');
    line.textContent = JSON.stringify(data);

    if (highlight) {
      line.className = 'highlight';
    }

    // Check if scroll is near bottom
    const shouldAutoScroll =
      log.scrollTop + log.offsetHeight >= log.scrollHeight - 10;

    log.appendChild(line);

    if (shouldAutoScroll) {
      log.scrollTop = log.scrollHeight;
    }
  }

  private async getCurrentGameClassId(): Promise<number | null> {
    const info = await OWGames.getRunningGameInfo();

    return (info && info.isRunning && info.classId) ? info.classId : null;
  }
}

InGame.instance().run();
