
/* 
	game.js

	A clicker game, cos i always wanted to make one
	g12345, for LD 39
*/

window.onload = function()
{
	Game.launch("screen");
}

dataFiles = ["font3.png", "bugback3.png", "bugspr1.png", "clicker1.png"];
soundFiles = []; 

filesLeft = 10;  

Images = [];
Sounds = [];

musicPlaying = 0;

mx = 0;
my = 0;

TileSize = 16;

map0 = 0;

distanceToEnd = 100;

HP = 10;

totalClicks = 0;

var score = 0;


KEYS = { LEFT:37, UP:38, RIGHT:39, DOWN:40, SPACE:32, ENTER:13, BACKSPACE:8 };

var Keyboard = function()
{
	var keysPressed = {};
	
	window.onkeydown = function(e) { keysPressed[e.keyCode] = true; };
	window.onkeyup = function(e) { keysPressed[e.keyCode] = false;	};
	this.isDown = function(keyCode)	{ return keysPressed[keyCode] === true; };
};



function fileLoaded(filename)
{
	filesLeft --;
	console.log(filename + " loaded.");
}

function loadFile(filename, nr)
{
	var img = new Image();
	img.addEventListener('load', fileLoaded(filename));
	img.src = filename;
	Images.push(img);
}

function loadMusicFile(filename)
{
	var snd = new Audio();
	snd.addEventListener('load', fileLoaded(filename));
	snd.src = filename;
	Sounds.push(snd);
}

fontSize = 16;
function sprint(screen,x,y,s)
// prints a string at x,y, no wrapping
{
	var px = x;
	var py = y;
	for (var i=0; i<s.length; i++)
	{
		c = s.charCodeAt(i);
		if ( (c>=97) && (c<=122) ) c-=32;
		if ( (c>=32) && (c<=95) )
		screen.drawImage (Images[0], (c-32)*fontSize,0, fontSize,fontSize, px,py, fontSize,fontSize);
		px += fontSize;
	}
}

function sprintnum(screen,x,y,n)
// prints a number at x,y, no wrapping
{
	sprint(screen,x,y,n+'');
}


Buttons = [ {x: 30, y: 60, w:64, h:64 }, {x: 30, y: 128, w:64, h:64 }, {x: 30, y: 192, w:64, h:64 }, {x: 30, y: 256, w:64, h:64 }, 
			{x: (800/2), y: 60, w:64, h:64 }, {x: (800/2), y: 128, w:64, h:64 }, {x: (800/2), y: 192, w:64, h:64 }, {x: (800/2), y: 256, w:64, h:64 },  ];


function is_wall(x,y)
// check if map coord (x,y) is a wall block or not
// monsters doesn't count.
{
	var c = map0[y][x];
	if ((c >= 4) && (c<8))
	{
		score ++;
		map0[y][x] = 0;
	}
	return ((c > 10) && (c !=45+6));
}

function is_floor(x,y)
// check if map coord (x,y) is a wall block or not
// monsters doesn't count.
{
	return (map0[y][x] > 10);
}

function is_wall2(x,y)
// check if PIXEL coord (x,y) is a wall block or not
// monsters doesn't count.
{
	return is_wall(Math.floor(x/TileSize), Math.floor(y/TileSize));
}

function is_floor2(x,y)
// check if PIXEL coord (x,y) is a wall block or not
// monsters doesn't count.
{
	return is_floor(Math.floor(x/TileSize), Math.floor(y/TileSize));
}

var mouseX = 0;
var mouseY = 0;
var mouseP = 0;
var mouseI = 0;
var mouseJ = 0;
var canvasi;
	
function getMousePos(canvas, event) 
{
	var rect = canvas.getBoundingClientRect();
	if ((event.pageX != undefined) && (event.pageY != undefined))
	{
		mouseX = event.pageX;
		mouseY = event.pageY;
	}
	else
	{
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
	mouseX -= rect.left;
	mouseY -= rect.top;
	mouseX = Math.floor(mouseX);
	mouseY = Math.floor(mouseY);
}
	
function mouse_is_inside(b)
{
	if  ((mouseX > b.x) && (mouseY > b.y) && (mouseX < b.x+b.w) && (mouseY < b.y+b.h))
		return 1;
	return 0;
}

buildings = [];

window.onmousemove = function(e) 
				{ 
					getMousePos( canvasi, e );
				};
					
window.onmousedown = function(e) 
				{ 
					getMousePos( canvasi, e );
					if ((mouseP == 0) && (e.buttons == 1))
					{
						mouseJ = 0;
						for (var i=0; i< Buttons.length; i++)
							if (mouse_is_inside(Buttons[i]))
								mouseJ = i+1;
						if (mouseJ > 0)
						{
							// console.log("mouseJ :"+mouseJ);
							if (buildings.length >= mouseJ)
							buildings[mouseJ-1].buy();
						}
					}
					mouseP = e.buttons;
				};

window.onmouseup = function(e) 
				{ 
					getMousePos( canvasi, e );
					mouseP = 0;
				};

function pretty_print_costs(c)
{
	var d = Math.round(c * 100);
	
	return d/100;
}

var Power = function()
{
	this.colour = "goldenrod";
	this.name = "Power";
	this.startcosts = 4;
	this.starttimer = 3*60*256;
	this.count = 0;
	this.unitoutput = 1;
	this.output = 0;
	this.timerbonus = 1;
	this.costs = this.startcosts;
	this.timer = 0;
	this.price_increase_factor = 1.05;
}

Power.prototype =
{
	getcosts: function()
	{
		return this.startcosts * Math.pow(this.price_increase_factor, this.count);
	},
	
	gettimer: function()
	{
		this.timerbonus = Math.pow(0.5, Math.floor(this.count/25));
		return this.starttimer * this.timerbonus;
	},
	
	getoutput: function()
	{
		return this.count * this.unitoutput;
	},
	
	buy: function()
	{
		if (money >= this.getcosts())
		{
			money -= this.getcosts();
			this.count ++;
			this.costs = this.getcosts();
			this.starttimer = this.gettimer();
			this.output = this.getoutput();
		}
	},
	
	tick: function()
	{
		if (this.count > 0)
		{
			this.timer += 256;
			if (this.timer >= this.starttimer)
			{
				this.timer -= this.starttimer;
				money += this.output;
			}
		}
	}
}

var Power1 = new Power();
{
	Power1.colour = "red";
	Power1.name = "Horse Power";
	Power1.startcosts = 4;
	Power1.starttimer = 1*60*256;
	Power1.unitoutput = 1;
	Power1.costs = Power1.startcosts;
	Power1.price_increase_factor = 1.07;
}

var Power2 = new Power();
{
	Power2.colour = "goldenrod";
	Power2.name = "Wind Power";
	Power2.startcosts = 60;
	Power2.starttimer = 3*60*256;
	Power2.unitoutput = 60;
	Power2.costs = Power2.startcosts;
	Power2.price_increase_factor = 1.15;
}

var Power3 = new Power()
{
	Power3.colour = "lightcyan";
	Power3.name = "Hydro Power";
	Power3.startcosts = 720;
	Power3.starttimer = 6*60*256;
	Power3.unitoutput = 540;
	Power3.costs = Power3.startcosts;
	Power3.price_increase_factor = 1.14;
}

var Power4 = new Power()
{
	Power4.colour = "teal";
	Power4.name = "Coal Power";
	Power4.startcosts = 8640;
	Power4.starttimer = 12*60*256;
	Power4.unitoutput = 4320;
	Power4.costs = Power4.startcosts;
	Power4.price_increase_factor = 1.13;
}

var Power5 = new Power()
{
	Power5.colour = "seagreen";
	Power5.name = "Solar Power";
	Power5.startcosts = 103680;
	Power5.starttimer = 24*60*256;
	Power5.unitoutput = 51840;
	Power5.costs = Power5.startcosts;
	Power5.price_increase_factor = 1.12;
}

var Power6 = new Power()
{
	Power6.colour = "yellow";
	Power6.name = "Nuclear Power";
	Power6.startcosts = 1244160;
	Power6.starttimer = 96*60*256;
	Power6.unitoutput = 622080;
	Power6.costs = Power6.startcosts;
	Power6.price_increase_factor = 1.10;
}

var Power7 = new Power()
{
	Power7.colour = "red";
	Power7.name = "Fusion Power";
	Power7.startcosts = 14929920;
	Power7.starttimer = 384*60*256;
	Power7.unitoutput = 7465000;
	Power7.costs = Power7.startcosts;
	Power7.price_increase_factor = 1.07;
}

var Power8 = new Power()
{
	Power8.colour = "white";
	Power8.name = "Brain Power";
	Power8.startcosts = 179159040;
	Power8.starttimer = 1536*60*256;
	Power8.unitoutput = 89580000;
	Power8.costs = Power8.startcosts;
	Power8.price_increase_factor = 1.05;
}



Game = {};

people = [];
money = 0;
ticks = 0;

Game.launch = function(canvasId)
{
	var canvas = document.getElementById(canvasId);
	var screen = canvas.getContext('2d');
	var gameSize = { x: canvas.width, y: canvas.height };
	
	// gameMode: 0 = start screen; 1 = game; 2 = game over;
	var gameMode = 0;
	
	canvasi = canvas;
	
	people = [ new Player() ];
	people.push (new Fly(people[0]));
	people.push (new Fly(people[0]));
	people.push (new Fly(people[0]));
	people.push (new Fly(people[0]));
	
	money = 4;
	buildings = [ Power1, Power2, Power3, Power4, Power5, Power6, Power7, Power8  ];
	//buildings[0].buy();
	
	filesLeft = dataFiles.length + soundFiles.length;
	
	for (var i=0; i<dataFiles.length; i++)
		loadFile(dataFiles[i], i);
	for (var i=0; i<soundFiles.length; i++)
		loadMusicFile(soundFiles[i], i);
	
	
	score = 0;
	var depth = 0;
	
	{
		totalClicks = 0;
	}

	var update = function()
	{
		if (gameMode === 1)
		{
			for (var i=people.length-1; i>=0; i--)
				people[i].update();
			
			if (people[0].keyb.isDown(KEYS.ENTER))
			{
				
				makeMap();
				score = 0;
			}
		}
		else
		{
			if (people[0].keyb.isDown(KEYS.ENTER))
			{
				if (gameMode === 0) gameMode = 1;
				if (gameMode === 3) gameMode = 1;
			}
		}
	}
	
	var camerax = 0;
	var cameray = 0;
	var clockticks = -1;
	
	
	
	    my = gameSize.y/TileSize;
	    mx = gameSize.x/TileSize;
		my -= 3;
	var sy = my;
	var sx = mx;
	
	mx = mx*2;
	my = my*6;
	
	map0 = new Array(my);
	
	for (var y=0; y<my; y++)
	{
		map0[y] = new Array(mx);
	}

	var makeMap = function()
	{
		for (var y=0; y<my; y++)
		{
			for (var x=0; x<mx; x++)
			{
				var c = 0;
				map0[y][x] = 0;
				
				if (y>5)
				{
					// muurtjes
					c = Math.random()
					if (c<0.04) 
					{
						if (y<50)
							map0[y][x] = 52;
						else
							map0[y][x] = 45;
					}
					
				}
				
				// sterretjes
				c = Math.random()
				if (c<0.01) map0[y][x] = 4;
				
				// muurtjes
				c = Math.floor(Math.random()*3);
				if (y === my-1) map0[y][x] = 34;
				if (x === 0) map0[y][x] = 34+c;
				if (x === mx-1) map0[y][x] = 34+c;
			}
		}
		
		people[0].onfloor = 0;
	}
	
	makeMap();
	score = 0;
	
	var draw = function(screen, gameSize, clockticks)
	{
		if (gameMode === 1)
		{

			camerax = (people[0].center.x / TileSize) - (sx/2);
			if (camerax < 0) camerax = 0;
			if (camerax > mx-sx) camerax = mx-sx;

			cameray = (people[0].center.y / TileSize) - (sy/2);
			if (cameray < 0) cameray = 0;
			if (cameray > my-sy) cameray = my-sy;

			var startx = Math.floor(camerax); 
			var restx = Math.floor( (camerax - startx) * TileSize );
			var starty = Math.floor(cameray); 
			var resty = Math.floor( (cameray - starty) * TileSize );
			// console.log(startx, starty);
			
			for (var x=0; x<=sx; x++)
			for (var y=0; y<=sy; y++)
			{
				screen.drawImage (Images[1],
					0,0, 
					TileSize,TileSize, 
					x*TileSize - restx,y*TileSize - resty, 
					TileSize,TileSize);
				if ( (starty+y<my) && (map0[starty+y][startx+x] > 0) )
				{
					screen.drawImage (Images[1], 
						(map0[starty+y][startx+x]%11)*TileSize, (Math.floor(map0[starty+y][startx+x]/11)) *TileSize, 
						TileSize,TileSize, 
						x*TileSize - restx,y*TileSize - resty, 
						TileSize,TileSize);
				}
				
				if (starty+y<my)
				{
					var c = map0[starty+y][startx+x];
					if ((c>=4) && (c<8))
					{	// sterretjes
						if (Math.random() < 0.1)
						{
							map0[starty+y][startx+x] = ( c<7 ? c+1 : 4);
						}
					}
				}
			}

			for (var i=0; i<people.length; i++)
				people[i].draw(screen, camerax, cameray);
			
			screen.fillStyle="goldenrod";
			screen.fillRect(0,gameSize.y-3*TileSize, gameSize.x, gameSize.y);

			depth = Math.floor (people[0].center.y / TileSize);
			sprint (screen, 16, 384-8, "Score: " + score + " Depth: " + depth + "  ");
			

			for (var i=0; i< Buttons.length; i++)
				// if (mouse_is_inside(Buttons[i]))
				{
					screen.drawImage (Images[3], 64, 0,
							64, 64,  // w, h
							Buttons[i].x, Buttons[i].y, 
							64, 64); // w, h
				}
				
			mouseI = 0;
			for (var i=0; i< Buttons.length; i++)
				if (mouse_is_inside(Buttons[i]))
					mouseI = i+1;
				
			for (var i=0; i< buildings.length; i++)
			{
				buildings[i].tick();
			}

			sprint (screen, 16, 384-8-16, "MX: " + mouseX + " MY: " + mouseY  + " MP: " + mouseP + " MI: " + mouseI);
			
			screen.font = 'bold 30pt Verdana';
			screen.fillText('Money: $'+pretty_print_costs(money), 60, 50);
			
			screen.font = '14pt Verdana';
			for (var i=0; i< buildings.length; i++)
			{
				var text;
				
				screen.fillStyle=buildings[i].colour;
				
				text = buildings[i].name + " x " + buildings[i].count;
				screen.fillText(text, Buttons[i].x + 64 + 20, Buttons[i].y + 15);
				
				text = "Next costs: $" + pretty_print_costs(buildings[i].costs);
				screen.fillText(text, Buttons[i].x + 64 + 20, Buttons[i].y + 30);
				
				text = "Output: $" + buildings[i].output;
				screen.fillText(text, Buttons[i].x + 64 + 20, Buttons[i].y + 45);
				
				text = "Timer: " + (buildings[i].starttimer -buildings[i].timer)/(256*100);
				screen.fillText(text, Buttons[i].x + 64 + 20, Buttons[i].y + 60);
			}
			
	//		sprint (screen, 16, 384-8-32, "Total Clicks: " + totalClicks );
	/*
			if ((depth <5) && (depth >0))
			{
				gameMode = 3;
				
				sprint (screen, 80, 140, "Well Done,");
				sprint (screen, 80, 180, "You have Escaped!");
				score += 100;
				sprint (screen, 80, 200, "Score: "+score);
				sprint (screen, 80, 220, "Press Enter to restart");
				
				makeMap();
				score = 0;
				people[0].center.y = 1600;
				people[0].center.x = 400;
				people[0].dir = 0;
				people[0].hold = 0;
				people[0].onfloor = 0;
				people[0].framenr = 1;
				
			}
		}
	*/	
			if (depth < 10)
			{
				depth = 100;
			}
		}
	
		if (gameMode === 0)
		{
			screen.fillStyle="black";
			screen.fillRect(0,0, gameSize.x, gameSize.y);
			
			sprint (screen, 150, 100, "Power Idle Clicker");
			sprint (screen, 16, 170, "Click on the boxes to buy yourself enough Power.");
			sprint (screen, 16, 190, "Every 25 of a power gives x2 speed bonus.");
			sprint (screen, 16, 230, "The Background contains my LD34 game, sorry. :)");
			sprint (screen, 16, 250, "Keys are Left, Right, and ENTER for reset");
			sprint (screen, 16, 290, "Press ENTER to start.");
			sprint (screen, 16, 330, "Made for Ludum Dare 39.");
//			sprint (screen, 16, 384-8-32, "Total Clicks: " + totalClicks );
		}
	}
	
	var tick = function()
	{
		if (filesLeft === 0)
		{
			// console.log ("All files loaded");
			update();
			clockticks ++;
			draw(screen, gameSize, clockticks);
			
			if (!musicPlaying)
			{
				musicPlaying = 1;
				if (Sounds.length > 0)
				{
					Sounds[0].loop = true;
					Sounds[0].play();
				}
			}
		}
		requestAnimationFrame(tick);
	}

	// This to start a game
	tick();
};


var Player = function()
{
	this.size = { x: 32, y: 32 };
	this.center = { x: 400, y: 1600 };
	this.keyb = new Keyboard();
	this.counter = 0;
	this.frame1 = 0;
	this.framenr = 1;
	this.type = 0; // player type = 0
	
	this.onfloor = 0; // 0 = falling, 1 = onfloor, 2 = jumping
	this.hold = 0; // how long has the player holding a key?
	this.dir = 0;  // which direction is the player holding?
}

Player.prototype =
{
	update: function()
	{
	//	if (this.counter%5 === 0)
		
		var nx = this.center.x;
		var ny = this.center.y;
		
		// falling down
		if (this.onfloor === 0)
		{
			ny += 6;
			if (ny + this.size.y > (map0.length-1) * TileSize)
			{
				this.onfloor = 1;
				ny = (map0.length-1) * TileSize - this.size.y;
			}
			
			if (is_floor2(nx, ny+31) || is_floor2(nx+16, ny+31) || is_floor2(nx+31, ny+31))
			{
				this.onfloor = 1;
				ny = ny - (ny % TileSize);
			}
			
			this.center.y = ny;
		}
		else
		// jumping up
		if (this.onfloor === 2)
		{
			ny -= 4;
			nx += this.dir * 6;
			
			if (nx < TileSize)
			{
				this.onfloor = 0;
				nx = TileSize;
				this.dir = 0;
				this.hold = 0;
			}
			if (nx + this.size.x > (mx-1) * TileSize)
			{
				this.onfloor = 0;
				nx = (mx-1) * TileSize - this.size.x;
				this.dir = 0;
				this.hold = 0;
			}
			
			if (this.dir===-1 && (is_wall2(nx, ny) || is_wall2(nx+16, ny) || is_wall2(nx, ny+16)) )
			{
				this.onfloor = 0;
				nx = this.center.x;
				this.dir = 0;
				this.hold = 0;
			}
			else
			if (this.dir===1 && (is_wall2(nx+31, ny) || is_wall2(nx+16, ny) || is_wall2(nx+31, ny+16)) )
			{
				this.onfloor = 0;
				nx = this.center.x;
				this.dir = 0;
				this.hold = 0;
			}
			
			if ( (this.dir===1) && (this.keyb.isDown(KEYS.LEFT)) )
			{
				this.dir = -1;
			}
			else
			if ( (this.dir===-1) && (this.keyb.isDown(KEYS.RIGHT)) )
			{
				this.dir = 1;
			}
			
			if (ny <= TileSize)
			{
				this.onfloor = 0;
				this.dir = 0;
				this.hold = 0;
				ny = TileSize;
			}
			
			this.framenr = 1;
			if (this.dir != 0)
			{
				this.framenr = 3 + (this.dir<0 ? 0 : 2);
			}
			
			this.center.x = nx;
			this.center.y = ny;
		}
		else
		// standing still
		// allows for input
		if (this.onfloor === 1)
		{
			// losgelaten -> jump
			if ( this.hold > 0 && !this.keyb.isDown(KEYS.LEFT) && !this.keyb.isDown(KEYS.RIGHT) )
			{
				this.onfloor = 2;
				
				// en ik heb nog:
				
				// this.dir
				// this.hold
			}
			
			if (this.keyb.isDown(KEYS.LEFT)) 
			{ 
				if (this.dir != -1) this.hold = 0; else this.hold ++;
				this.dir = -1;
			}
			
			if (this.keyb.isDown(KEYS.RIGHT)) 
			{ 
				if (this.dir != 1) this.hold = 0; else this.hold ++;
				this.dir = 1;
			}
			
			this.framenr = 1;
			if (this.dir != 0)
			{
				this.framenr = 2 + (this.dir<0 ? 0 : 2);
			}
			else
			{
				this.hold = 0;
				this.dir = 0;
			}
				
		
			// this is for wall checking later
			if (false)
			{
				this.center.x = nx;
				this.center.y = ny;
			}
		}
		
		this.counter++;
		this.counter %= 40;

	},
	
	draw: function(screen, camerax, cameray)
	{
		// sprint (screen, 16,8,"Hello World!");
		// sprintnum (screen, 16,24,32769);
		distanceToEnd = mx - this.center.x/32 - 2;
//		sprint (screen, 16, 8, "Distance: " + distanceToEnd + 'm');
//		sprint (screen, 16, 384-8-16, "Hold: " + this.hold + " State: " + this.onfloor + ' ');
		screen.drawImage (Images[2], this.framenr*32, 0,
							this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							this.size.x,this.size.y);
	}
}

var Fly = function(player)
{
	this.size = { x: 16, y: 8 };
	this.center = { x: Math.floor(Math.random()*(50-2)*TileSize), y: Math.floor(Math.random()*(50-2)*TileSize) };
	this.player = player;
	this.counter = 0;
}

Fly.prototype =
{
	update: function()
	{

		if (this.center.x < this.player.center.x+8) this.center.x += 1;
		if (this.center.y < this.player.center.y+10) this.center.y += 1;
		if (this.center.x > this.player.center.x+8) this.center.x -= 1;
		if (this.center.y > this.player.center.y+10) this.center.y -= 1;
		
		if ( (this.center.x === this.player.center.x+8) && (this.center.y === this.player.center.y+10) )
			this.center = { x: Math.floor(Math.random()*(mx-2)*TileSize), y: Math.floor(Math.random()*(my-2)*TileSize) };
			//this.center = { x: Math.floor(Math.random()*300)*2, y: Math.floor(Math.random()*200)*2 };
		
		this.counter ++;
		this.counter %= 40;
	},
	
	draw: function(screen, camerax, cameray)
	{
		screen.drawImage (Images[1], 16+(this.counter >= 20?16:0), 0, this.size.x,this.size.y, 
							this.center.x-(camerax*TileSize),this.center.y-(cameray*TileSize), 
							this.size.x,this.size.y);
	}
}


