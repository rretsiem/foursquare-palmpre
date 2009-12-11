function FriendsListAssistant(a, ud, un, pw,i,la,lo) {
	 this.auth = a;
	 this.userData = ud;
	 this.username=un;
	 this.password=pw;
	 this.uid=i;
	 this.lat=la;
	 this.long=lo;
}

FriendsListAssistant.prototype.setup = function() {
	Mojo.Log.error("#####setting up friends");
	//Create the attributes for the textfield
	this.textFieldAtt = {
			hintText: 'Find some friends!',
			textFieldName:	'name', 
			multiline:		false,
			disabledProperty: 'disabled',
			focus: 			true, 
			modifierState: 	Mojo.Widget.capsLock,
			limitResize: 	false, 
			holdToEnable:  false, 
			focusMode:		Mojo.Widget.focusSelectMode,
			changeOnKeyPress: true,
			textReplacement: false,
			maxLength: 30,
			requiresEnterKey: false
	};
	//Create the model for the text field
	this.textModel = {
		value : ''
	};
	
	this.resultsModel = {items: [], listTitle: $L('Results')};
	//Setup the textfield widget and observer
	this.controller.setupWidget('sendField', this.textFieldAtt, this.textModel);
    
	// Set up the attributes & model for the List widget:
	this.controller.setupWidget('results-friends-list', 
					      {itemTemplate:'listtemplates/friendItems',dividerTemplate: 'listtemplates/dividertemplate'},
					      this.resultsModel);

	//Set up button handlers
	this.buttonModel1 = {
		buttonLabel : 'Find Friends',
		buttonClass : '',
		disable : false
	}
	this.buttonAtt1 = {
		type : Mojo.Widget.activityButton
	}
	
	this.controller.setupWidget('go_button',this.buttonAtt1,this.buttonModel1);


	this.avbuttonModel1 = {
		buttonLabel : 'Add New Venue',
		buttonClass : '',
		disable : false
	}
	this.avbuttonAtt1 = {
	}
	

	
	Mojo.Event.listen(this.controller.get('go_button'),Mojo.Event.tap, this.onSearchFriends.bind(this));
	Mojo.Event.listen(this.controller.get('results-friends-list'),Mojo.Event.listTap, this.listWasTapped.bind(this));


    this.controller.setupWidget(Mojo.Menu.viewMenu,
        this.menuAttributes = {
           spacerHeight: 0,
           menuClass: 'no-fade'
        },
        this.menuModel = {
            visible: true,
            items: [ {
                items: [
                { iconPath: 'map.png', command: 'friend-map', label: "  "},
                { label: "Friends", width: 200 ,command: 'friends-list'},
                { iconPath: 'search.png', command: 'friend-search', label: "  "}]
            }]
        });
        
    this.controller.setupWidget(Mojo.Menu.commandMenu,
        this.cmattributes = {
           spacerHeight: 0,
           menuClass: 'no-fade'
        },
        this.cmmodel = {
          visible: true,
          items: [{
          	items: [ 
                 { iconPath: "images/venue_button.png", command: "do-Venues"},
                 { iconPath: "images/friends_button.png", command: "do-Nothing"},
                 { icon: "back", command: "do-Tips"},
                 { iconPath: "images/shout_button.png", command: "do-Shout"},
                 { iconPath: "images/badges_button.png", command: "do-Badges"},
                 { iconPath: 'images/leader_button.png', command: 'do-Leaderboard'}
                 ]/*,
            toggleCmd: "do-Venues"*/
            }]
    });
    
    
        this.controller.setupWidget("drawerId",
         this.drawerAttributes = {
             modelProperty: 'open',
             unstyled: false
         },
         this.drawerModel = {
             open: false
         });


    this.controller.setupWidget("spinnerId",
         this.attributes = {
             spinnerSize: 'large'
         },
         this.model = {
             spinning: true 
         });


    
    Mojo.Log.error("#########setup friends");
    
    $("message").hide();
    
    	       this.getFriends();

}

var auth;

function make_base_auth(user, pass) {
  var tok = user + ':' + pass;
  var hash = Base64.encode(tok);
  //$('message').innerHTML += '<br/>'+ hash;
  return "Basic " + hash;
}

FriendsListAssistant.prototype.getFriends = function() {
	$('message').innerHTML += '<br/>Friends Venues...';
	
	var url = 'http://api.foursquare.com/v1/friends.json';
	auth = make_base_auth(this.username, this.password);
	var request = new Ajax.Request(url, {
	   method: 'get',
	   evalJSON: 'force',
	   requestHeaders: {Authorization: auth}, //Not doing a search with auth due to malformed JSON results from it
	   parameters: {},
	   onSuccess: this.getFriendsSuccess.bind(this),
	   onFailure: this.getFriendsFailed.bind(this)
	 });

}



/*
this funciton gets called when the getfriendslist ajax is successful.
it loads the friend names and icons into the list, then sets the global var for total count of friends
and the fires off the loop that gets the details of each friend
*/
FriendsListAssistant.prototype.getFriendsSuccess = function(response) {
	//var mybutton = $('go_button');
	//mybutton.mojo.deactivate();
	Mojo.Log.error("****friends="+response.responseText);

	if (response.responseJSON == undefined) {
		$('message').innerHTML = 'No Results Found';
	}
	else {
		//$("spinnerId").mojo.stop();
		//$("spinnerId").hide();
		//$('resultListBox').style.display = 'block';
		//Got Results... JSON responses vary based on result set, so I'm doing my best to catch all circumstances
		this.friendList = [];
		this.looping=false;
		
		if(response.responseJSON.friends != undefined) {
			for(var f=0;f<response.responseJSON.friends.length;f++) {
				this.friendList.push(response.responseJSON.friends[f]);
			}
		}
		this.resultsModel.items =this.friendList; //update list with basic user info
		this.controller.modelChanged(this.resultsModel);
		
		
		//now start that loop!
		this.totalfriends=response.responseJSON.friends.length;
		this.onfriend=0;
		this.getFriendsInfo();
		

	}
		

}


FriendsListAssistant.prototype.getFriendsInfo = function() {
	if(this.onfriend < this.totalfriends){ //array is zero-based, so it'll never equal total number. 
		
		
					var url = 'http://api.foursquare.com/v1/user.json';
					auth = make_base_auth(this.username, this.password);
					var theuser=this.friendList[this.onfriend].id;
					var request = new Ajax.Request(url, {
					   method: 'get',
					   evalJSON: 'force',
					   requestHeaders: {Authorization: auth}, //Not doing a search with auth due to malformed JSON results from it
					   parameters: {uid: theuser},
					   onSuccess: function(uresponse){
							Mojo.Log.error("***friend["+(this.onfriend)+"] ("+this.friendList[this.onfriend].firstname+") info="+uresponse.responseText);	
							this.friendList[this.onfriend].checkin=(uresponse.responseJSON.user.checkin.venue != undefined)? uresponse.responseJSON.user.checkin.venue.name: "[Off the Grid]";
							this.friendList[this.onfriend].geolat=(uresponse.responseJSON.user.checkin.venue != undefined)? uresponse.responseJSON.user.checkin.venue.geolat: "0";
							this.friendList[this.onfriend].geolong=(uresponse.responseJSON.user.checkin.venue != undefined)? uresponse.responseJSON.user.checkin.venue.geolong: "0";
			   				Mojo.Log.error("***checkin="+this.friendList[this.onfriend].checkin);
							this.resultsModel.items =this.friendList;// $A(venueList);
							this.controller.modelChanged(this.resultsModel);
							this.onfriend++;
							Mojo.Log.error("#####totalfriends="+this.totalfriends+", onfriend="+this.onfriend);
							this.getFriendsInfo();
					   }.bind(this),
					   onFailure: this.getUserInfoFailed.bind(this)
					 });
					 
	}else{
		var mybutton = $('go_button');
		mybutton.mojo.deactivate();
		$("spinnerId").mojo.stop();
		$("spinnerId").hide();
		$('resultListBox').style.display = 'block';

	}
}
FriendsListAssistant.prototype.getUserInfoFailed = function(event) {

}
FriendsListAssistant.prototype.getFriendsFailed = function(event) {

}

FriendsListAssistant.prototype.onSearchFriends = function(event) {

}

FriendsListAssistant.prototype.listWasTapped = function(event) {
	
	/*this.controller.showAlertDialog({
		onChoose: function(value) {
			if (value) {
				this.checkIn(event.item.id, event.item.name);
			}
		},
		title:"Foursquare Check In",
		message:"Do you want to check in here?",
		cancelable:true,
		choices:[ {label:'Yes', value:true, type:'affirmative'}, {label:'No', value:false, type:'negative'} ]
	});
	*/
	
	this.controller.stageController.pushScene({name: "user-info", transition: Mojo.Transition.crossFade, disableSceneScroller: false},this.auth,event.item.id);
}




FriendsListAssistant.prototype.handleCommand = function(event) {
        if (event.type === Mojo.Event.command) {
            switch (event.command) {
                case "friend-search":
                	Mojo.Log.error("===========venue search clicked");
					//get the scroller for your scene
					var scroller = this.controller.getSceneScroller();
					//call the widget method for scrolling to the top
					scroller.mojo.revealTop(0);
					$("drawerId").mojo.toggleState();
					this.controller.modelChanged(this.drawerModel);
                	break;
				case "friend-map":
					Mojo.Log.error("lat="+this.lat+", long="+this.long);
					this.controller.stageController.pushScene({name: "friends-map", transition: Mojo.Transition.crossFade},this.lat,this.long,this.resultsModel.items,this.username,this.password,this.uid,this);
					break;
				case "do-Venues":
                	//var thisauth=auth;
					//this.controller.stageController.pushScene({name: "nearby-venues", transition: Mojo.Transition.crossFade},thisauth,userData,this.username,this.password,this.uid);
					this.controller.stageController.popScene("friends-list");
					break;
				case "do-Friends":
                	var thisauth=auth;
					this.controller.stageController.pushScene({name: "friends-list", transition: Mojo.Transition.crossFade},thisauth,userData,this.username,this.password,this.uid);
					break;
                case "do-Badges":
                	var thisauth=auth;
					this.controller.stageController.pushScene({name: "user-info", transition: Mojo.Transition.crossFade},thisauth,"");
                	break;
                case "do-Shout":
                	var checkinDialog = this.controller.showDialog({
						template: 'listtemplates/do-shout',
						assistant: new DoShoutDialogAssistant(this,auth)
					});

                	break;
            }
        }
    }


FriendsListAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


FriendsListAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

FriendsListAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}