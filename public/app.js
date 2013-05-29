(function() {
    // Client name
    var clientName;

    // Configure editor
    var editor = ace.edit("editor");
    editor.setByAPI = false;
    editor.setFontSize(18);
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");

    var socket = io.connect();
    socket.on('editorUpdate', function (data) {
        editor.setByAPI = true;
        editor.setValue(data.contents);
        editor.clearSelection();
        editor.setByAPI = false;
    });

    // prompt for client name, then get capability token from server
    $(function() {
        // Track user changes to the editor
        editor.on('change', function() {
            if (!editor.setByAPI) {
                socket.emit('editorUpdate', {
                    contents:editor.getValue()
                });
            }
        });

        // Handle UI to connect to conference call
        function resetCallInterface() {
            $('button').html('Voice Chat');
            Twilio.Device.disconnectAll();
            callConnected = false;
        }

        var callConnected = false;
        $('button').on('click', function() {
            if (!callConnected) {
                Twilio.Device.connect();
            }
            else {
                resetCallInterface();
            }
        });

        // Update call state and UI
        Twilio.Device.connect(function(conn) {
            callConnected = true;
            $('button').html('Leave Voice Chat');
        });

        // Reset the UI on an error
        Twilio.Device.error(function(error) {
            console.log(error);
            resetCallInterface();
        });

        // Give editor time to render
        setTimeout(function() {
            // Get this user's chosen username
            clientName = escape(prompt('Please enter a username:').replace(' ','_'));

            // Fetch a Twilio Client access token from the server
            $.ajax('/token', {
                data: {
                    clientName:clientName
                },
                success: function(token) {
                    // Set up Twilio soft phone
                    Twilio.Device.setup(token);

                    // Detect which clients are currently connected
                    var clients = [clientName];
                    Twilio.Device.presence(function(e) {
                        // We don't have this client - add if available
                        if (clients.indexOf(e.from) < 0) {
                            e.available && clients.push(e.from);
                        }
                        // We already have this client - remove if not available
                        else {
                            e.available || clients.splice(clients.indexOf(e.from),1);
                        }

                        // Display all connected clients in the ul
                        $('ul').html('');
                        for (var i = 0, l = clients.length; i<l; i++) {
                            $('ul').append('<li>'+clients[i]+'</li>');
                        }
                    });
                }
            });

        },500);
    });

})();
