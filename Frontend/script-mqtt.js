// import { connect } from "http2";
import "https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js";
import config from "./config.js"

console.log('let the game begin');

// Global variables declaration
const MQTT_CONNECTION_HOST = `${config.WS_URL}/mqtt`;
const MQTT_CONNECTION_OPTION = {
    clientId: 'mqttx_' + Math.random().toString(16).slice(3),
};
let user;
let client;
let onlineUsers = [];
let currentTopic = null;
let currentMessage = null;
let groups = [];

const updateOnline = (users) => {
    let onlineUsersListDiv = document.getElementById('online-users-list');
    onlineUsersListDiv.innerHTML = '<div style="color: green;">ONLINE USERS</div>';
    users.forEach(currentUser => {
        if(currentUser.id != user.id) {
            let newChild = document.createElement('div');
            newChild.classList.add('online-users');
            newChild.id = `user-${currentUser.id}`;
            newChild.innerText = currentUser.name;
            newChild.addEventListener('click', e => {
                document.getElementById('group-members').innerHTML = ``;
                currentTopic = e.target.id.split('-')[1];
                currentMessage = e.target.innerText;
                document.getElementById('current-chat').innerText = currentMessage;
                displayChat();
                document.getElementById(e.target.id).style.color = 'white';
            });
            onlineUsersListDiv.appendChild(newChild);
        }
    });
}

const updateGroups = () => {
    let groupsListDiv = document.getElementById('groups-list');
    groupsListDiv.innerHTML = `<div style="color: green;">GROUPS</div>`;
    let i=0;
    groups.forEach(current => {
        let newChild = document.createElement('div');
        newChild.classList.add('groups');
        newChild.id = `group-${current.id}`;
        newChild.innerText = current.name;
        client.subscribe(`group-${current.id}`);
        newChild.addEventListener('click', e => {
            currentTopic = `${e.target.id}`;
            currentMessage = e.target.innerText;
            document.getElementById('current-chat').innerText = currentMessage;
            displayChat();
            document.getElementById(e.target.id).style.color = 'white';

            let groupMembersDiv = document.getElementById('group-members');
            groupMembersDiv.innerHTML = `<div style="color: skyblue;">Group Members:</div>`;
            let groupUsers = null;
            for(let i=0; i<groups.length; i++) {
                if(groups[i]['name'] == currentMessage) {
                    groupUsers = groups[i].userIDs;
                    break;
                }
            }
            let keys = Object.keys(groupUsers);
            keys.forEach(key => {
                let tempChild = document.createElement('div');
                tempChild.innerText = groupUsers[key];
                groupMembersDiv.appendChild(tempChild);
            });
        });
        groupsListDiv.appendChild(newChild);
    });
}

const displayChat = () => {
    let messageBox = document.getElementById('messages-box');
    if(!currentTopic) {
        messageBox.innerHTML = `
            <div class="message center">Select a chat to continue</div>
        `;
    } else {
        let chat = `chat-${currentTopic}`;
        chat = JSON.parse(localStorage.getItem(chat));
        if(!chat) chat = [];
        messageBox.innerHTML = `
            <div class="message center">You joined the chat</div>
        `;
        chat.forEach(current => {
            let newChild = document.createElement('div');
            newChild.classList.add('message');
            newChild.classList.add(current.user.id === user.id ? 'right' : 'left');
            newChild.innerText = `${current.user.id === user.id ? 'YOU' : current.user.name}: ${current.message}`;
            messageBox.appendChild(newChild);
        });
    }
    messageBox.scrollTo(0, messageBox.scrollHeight);
}

const onJoinChat = async () => {

    user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('head').innerHTML = `
        <h4>Your ID: ${user.id}</h4>
        <h4>Your Name: ${user.name}</h4>
    `;
    document.getElementById('main').style.display = 'none';
    document.getElementById('main2').style.display = 'flex';
    onlineUsers[0] = user;

    let res = await fetch(`${config.HTTP_URL}/groups/${user.id}`);
    let data = await res.json();
    if(data.status) groups = data.data;
    
    client = mqtt.connect(MQTT_CONNECTION_HOST, MQTT_CONNECTION_OPTION);
    client.publish('user-joined', JSON.stringify(user));
    client.subscribe(`new-group-${user.id}`);
    client.subscribe('updated-users-list');
    client.subscribe(`${user.id}`);
    document.getElementById('current-chat').innerText = currentMessage;

    updateGroups();
    displayChat();

    client.on('message', (topic, payload) => {
        payload = JSON.parse(payload.toString());
        switch (topic) {
            case 'updated-users-list':
                onlineUsers = payload;
                updateOnline(onlineUsers);
                break;

            case `${user.id}`:
                let privateChat = JSON.parse(localStorage.getItem(`chat-${payload.user.id}`));
                if(!privateChat) privateChat = [];
                privateChat.push(payload);
                localStorage.setItem(`chat-${payload.user.id}`, JSON.stringify(privateChat));
                if(currentTopic == payload.user.id) displayChat();
                else document.getElementById(`user-${payload.user.id}`).style.color = 'yellow';
                break;

            case `new-group-${user.id}`:
                groups.push(payload);
                updateGroups();
                document.getElementById(`group-${payload.id}`).style.color = 'yellow';
                break;
            
            default:
                if(topic.includes('group-')) {
                    if(payload.user.id != user.id) {
                        let chat = JSON.parse(localStorage.getItem(`chat-${topic}`));
                        if(!chat) chat = [];
                        chat.push(payload);
                        localStorage.setItem(`chat-${topic}`, JSON.stringify(chat));
                        if(currentTopic == topic) displayChat();
                        else document.getElementById(topic).style.color = 'yellow';
                    }
                }
                break;
        }
    });
}


if (!localStorage.getItem('user')) {
    document.getElementById('main').style.display = 'flex';
    document.getElementById('main2').style.display = 'none';
}
else onJoinChat();

// on click signup button
document.getElementById('signup-button').addEventListener('click', (e) => {
    document.getElementById('response-signup').innerText = '';
    let name = document.getElementById('name').value;
    let pin = document.getElementById('PIN-Signup').value;
    if (pin < 1000 || pin > 9999) {
        document.getElementById('response-signup').innerText = 'Enter 4 digit PIN only';
        document.getElementById('response-signup').style.color = 'red';
        return;
    }
    document.getElementById('name').value = '';
    document.getElementById('PIN-Signup').value = '';

    try {
        (async () => {
            let res = await fetch(`${config.HTTP_URL}/signup`, {
                method: 'post',
                body: JSON.stringify({ name, pin }),
                headers: { 'Content-type': 'application/json; charset=UTF-8' }
            });
            let data = await res.json();
            if (data.status === 1) {
                document.getElementById('response-signup').innerText = `Your ID is ${data.data.id}. Login to continue.`;
                document.getElementById('response-signup').style.color = 'green';
            }
            else {
                document.getElementById('response-signup').innerText = `Failed to create your account`;
                document.getElementById('response-signup').style.color = 'red';
            }
        })();
    } catch (error) {
        document.getElementById('response-signup').innerText = 'Failed to reach server';
        document.getElementById('response-signup').style.color = 'red';
        return;
    }
});


// on click login button
document.getElementById('login-button').addEventListener('click', (e) => {
    document.getElementById('response-login').innerText = '';
    let id = document.getElementById('id').value;
    let pin = document.getElementById('PIN-Login').value;
    if (pin < 1000 || pin > 9999) {
        document.getElementById('response-login').innerText = 'Enter 4 digit PIN only';
        document.getElementById('response-login').style.color = 'red';
        return;
    }
    document.getElementById('id').value = '';
    document.getElementById('PIN-Login').value = '';

    (async () => {
        try {
            let res = await fetch(`${config.HTTP_URL}/login`, {
                method: 'post',
                body: JSON.stringify({ id, pin }),
                headers: { 'Content-type': 'application/json; charset=UTF-8' }
            });
            let data = await res.json();
                if (data.status === 0) {
                    document.getElementById('response-login').innerText = data.message;
                    document.getElementById('response-login').style.color = 'red';
                }
                else {
                    localStorage.setItem('user', JSON.stringify({ name: data.data.name, id: data.data.id }));
                    onJoinChat();
                }
        } catch (error) {
            document.getElementById('response-login').innerText = 'Failed to reach server';
            document.getElementById('response-login').style.color = 'red';
            return;
        }
    })();
});

// on click send message button
document.getElementById('send-button').addEventListener('click', (e) => {
    let message = document.getElementById('message-text').innerText;
    if (message && message.length && currentTopic) {
        client.publish(currentTopic, JSON.stringify({ user, message }));
        let messageBox = document.getElementById('messages-box');
        let newChild = document.createElement('div');
        newChild.classList.add('message');
        newChild.classList.add('right');
        newChild.innerText = `YOU: ${message}`;
        messageBox.appendChild(newChild);
        let chat = JSON.parse(localStorage.getItem(`chat-${currentTopic}`));
        if(!chat) chat = [];
        chat.push({ user, message});
        localStorage.setItem(`chat-${currentTopic}`, JSON.stringify(chat));
    }
    document.getElementById('message-text').innerText = 'Enter your message here';
});
// on click logout button
document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.clear();
    location.reload();
});

window.onbeforeunload = () => {
    client.publish('user-left', JSON.stringify(user));
}









/* ********************************************************** */
document.getElementById('create-group-button').addEventListener('click', async () => {
    let res = await fetch(`${config.HTTP_URL}/users`);
    let data = await res.json();
    let usersListDiv = document.getElementById('users-list');
    let tempHTML = `<input type="text" id="group-name" placeholder="Group Name">`;
    for(let i=0; i<data.length; i++) {
        if(data[i].id == user.id) continue;
        tempHTML += `
            <input type="checkbox" class="user-checkboxes" id="${data[i].id}" name="${data[i].name}">
            <label for="${data[i].id}">${data[i].name}</label><br>
        `;
    }
    usersListDiv.innerHTML += tempHTML;
    usersListDiv.innerHTML += `<button id="submit-group-button">Create</button>`;
    document.getElementById('submit-group-button').addEventListener('click', async () => {
        let groupName = document.getElementById('group-name').value;
        let userCheckboxes = document.getElementsByClassName('user-checkboxes');
        let IDs = `{"${user.id}": "${user.name}"`;
        let IDs2 = [];
        IDs2.push(user.id);
        Array.from(userCheckboxes).forEach(current => {
            if(current.checked) {
                IDs += `,"${current.id}": "${current.name}"`;
                IDs2.push(current.id);
            }
        });
        IDs += '}';

        let res = await fetch(`${config.HTTP_URL}/group`, {
            method: "POST",
            body: JSON.stringify({ groupName, IDs: JSON.parse(IDs) }),
            headers: { "Content-type": "application/json; charset=UTF-8" }
        });
        let data = await res.json();
        if(data.status) {
            for(let i=0; i<IDs2.length; i++) {
                client.publish(`new-group-${IDs2[i]}`, JSON.stringify({ name: groupName, id: data.groupID }));
            }
        }
        usersListDiv.innerHTML = ``;
    });
});