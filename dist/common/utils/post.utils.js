"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityPost = void 0;
const post_enum_1 = require("../enum/post.enum");
const AvailabilityPost = (req) => {
    return [
        { availability: post_enum_1.Availability_Enum.public },
        {
            availability: post_enum_1.Availability_Enum.only_me,
            createBy: req.user._id,
        },
        {
            availability: post_enum_1.Availability_Enum.friends,
            createBy: { $in: [...(req.user?.friends || []), req.user._id] },
        },
        {
            tags: { $in: [req.user._id] },
        },
    ];
};
exports.AvailabilityPost = AvailabilityPost;
