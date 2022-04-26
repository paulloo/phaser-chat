const phaserConfig = {
    type: Phaser.AUTO,
    parent: "game",
    width: 1280,
    height: 760,
    backgroundColor: "#E7F6EF",
    dom: {
      createContainer: true,
    },
    scene: {
      init: initScene,
      preload: preloadScene,
      create: createScene,
    },
  };

  const game = new Phaser.Game(phaserConfig);

  function initScene() {
    this.socket = io("http://localhost:3000", { autoConnect: false });
    this.chatMessages = []
  }
  function preloadScene() {
    this.load.html("form", "form.html");
  }

  function createScene() {
    this.textInput = this.add
      .dom(1135, 690)
      .createFromCache("form")
      .setOrigin(0.5);
    this.chat = this.add.text(1000, 10, "", {
      lineSpacing: 15,
      backgroundCorlor: "#21313CDD",
      color: "#26924F",
      padding: 10,
      fontStyle: "bold",
    });

    this.enterKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    this.enterKey.on("down", (event) => {
        console.log("event: ", event)
        let chatBox = this.textInput.getChildByName('chat');
        if(chatBox.value !== '') {
            this.socket.emit('message', chatBox.value)
            chatBox.value = ''
        }
    });

    this.socket.connect();

    this.socket.on("connect", async () => {
      this.socket.emit("join", "mongodb");
    });

    this.socket.on("joined", async (gameId) => {
        console.log("gameId: ", gameId)
      let result = await fetch(
        `http://localhost:3000/chats?room=${gameId}`
      ).then((response) => response.json());

      this.chatMessages = result.messages;
      this.chatMessages.push("Welcom to " + gameId);

      if (this.chatMessages.length > 20) {
        this.chatMessages.shift();
      }

      this.chat.setText(this.chatMessages);
    });

    this.socket.on("message", (message) => {
        this.chatMessages.push(message)
        
        if (this.chatMessages.length > 20) {
          this.chatMessages.shift();
        }
        this.chat.setText(this.chatMessages);
    })
  }