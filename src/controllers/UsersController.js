const AppError = require("../utils/AppError")
const sqliteConnection = require("../database/sqlite")
const {hash, compare} = require("bcryptjs")

class UsersController {
    async create(request, response){
        const {name, email, password} = request.body

        const database = await sqliteConnection()
        const user = await database.get("select * from users where id = (?)", [id])

        const checkUserExists = await database.get('select * from users where email = (?)', [email])

        if (checkUserExists){            
            throw new AppError('Este email já está em uso');
        }

        const hashedPassword = await hash(password, 8)

        await database.run("insert into users (name, email, password) values (?, ?, ?)", [name, email, hashedPassword])

        response.status(201).json()
    }

    async update(request, response){
        const {name, email, password, old_password} = request.body
        const {id} = request.params

        const database = await sqliteConnection()
        const user = await database.get("select * from users where id = (?)", [id])

        if(!user){
            throw new AppError("Usuário não encontrado")
        }

        const userWithUpdatedEmail = await database.get("select * from users where email = (?)", [email])

        if (userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id){
            throw new AppError("Este email já está em uso")
        }

        user.name = name ?? user.name
        user.email = email ?? user.email

        if (password && !old_password){
            throw new AppError ("Você precisa digitar a senha antiga")
        }

        if (password && old_password){
            const checkOldPassword = await compare(old_password, user.password)
            if (!checkOldPassword){
                throw new AppError("A senha antiga não confere")
            }
            user.password = await hash(password, 8)
        }

        await database.run(`
        update users set
        name = ?,
        email = ?,
        updated_at = datetime('now')
        where id = ?`,
        [user.name, user.email, id]
        )

        return response.json()
    }
}


module.exports = UsersController