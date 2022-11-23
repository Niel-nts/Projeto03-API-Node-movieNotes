const knex = require("../database/knex")

class NotesController{
    async create(request, response){
        const {title, description, rating, movie_tags} = request.body
        const {user_id} = request.params

        const note_id = await knex("movie_notes").insert({
            title,
            description,
            user_id,
            rating
        })

        const tagsInsert = movie_tags.map(tag => {
            return {
                note_id,
                tag_name: tag,
                user_id
            }            
        })

        await knex("movie_tags").insert(tagsInsert)

        response.json()
    }

    async show(request, response){
        const {id} = request.params

        const note = await knex("movie_notes").where({id}).first()
        const tags = await knex("movie_tags").where({note_id: id}).orderBy("tag_name")
        return response.json({...note, tags})
    }

    async delete(request, response){
        const {id} = request.params

        await knex("movie_notes").where({id}).delete()

        return response.json()
    }

    async index(request, response){
        const {title, user_id, tags} = request.query

        let notes

        if(tags){
            const filterTags = tags.split(',').map(tag => tag.trim())

            notes = await knex("movie_tags")
            .select(["movie_notes.id", "movie_notes.title", "movie_notes.user_id"])
            .where("movie_notes.user_id", user_id)
            .whereLike("movie_notes.title", `%${title}%`)
            .whereIn("tag_name", filterTags)
            .innerJoin("movie_notes", "movie_notes.id", "movie_tags.note_id")
            .orderBy("movie_notes.title")
        } else {
            notes = await knex("movie_notes").where({user_id}).whereLike("title", `%${title}%`).orderBy("title")
        }


        return response.json(notes)
    }
}

module.exports = NotesController