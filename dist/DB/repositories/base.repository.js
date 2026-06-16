"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create(data) {
        return this.model.create(data);
    }
    async findById(id) {
        return this.model.findById(id);
    }
    async findOne({ filter, projection = undefined, options, }) {
        return this.model
            .findOne(filter, projection, options)
            .populate(options?.populate)
            .select(options?.select)
            .sort(options?.sort)
            .exec();
    }
    async find({ filter, projection, options, }) {
        return this.model
            .find(filter, projection)
            .sort(options?.sort)
            .skip(options?.skip)
            .limit(options?.limit)
            .populate(options?.populate);
    }
    async findByIdAndUpdate({ id, update, options, }) {
        return this.model.findByIdAndUpdate(id, update, {
            new: true,
            ...options,
        });
    }
    async findOneAndUpdate({ filter, update, options, }) {
        return this.model.findOneAndUpdate(filter, update, {
            new: true,
            ...options,
        });
    }
    async findOneAndDelete({ filter, options, }) {
        return this.model.findOneAndDelete(filter, options);
    }
    async paginate({ page, limit, sort, populate, search, }) {
        page = Number(page) || 1;
        limit = Number(limit) || 5;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 5;
        const skip = (page - 1) * limit;
        const [data, totalDoc] = await Promise.all([
            this.model
                .find({ ...(search ?? {}) })
                .sort(sort ?? {})
                .skip(skip)
                .limit(limit)
                .populate(populate),
            this.model.countDocuments({ ...(search ?? {}) }),
        ]);
        const totalPages = Math.ceil(totalDoc / limit);
        return {
            meta: {
                currentPage: page,
                totalPages,
                limit,
                totalDoc,
            },
            data,
        };
    }
}
exports.default = BaseRepository;
