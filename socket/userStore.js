class UserStore {
    
    constructor(){
        this.users = new Map();
        this.socketMap = new Map();
    }

    addUser(userId , socketId){
        this.users.set(userId , socketId);
        this.socketMap.set(socketId , userId);
    }

    removeUser(socketId){
        const userId = this.socketMap.get(socketId);
        this.users.delete(userId);
        this.socketMap.delete(socketId);
    }

    getUser(userId){
        if(!userId || !this.users.has(userId)){
            return null;
        }
        return this.users.get(userId);
    }

    getAllUsers(){
        return this.users;
    }
}

module.exports = new UserStore();
