import { Request } from "express";
import { Availability_Enum } from "../enum/post.enum";

export const AvailabilityPost = (req: Request) => {
  return {
    deletedAt: { $exists: false },
    $or: [
      { availability: Availability_Enum.public },
      {
        availability: Availability_Enum.only_me,
        createBy: req.user._id,
      },
      {
        availability: Availability_Enum.friends,
        createBy: { $in: [...(req.user?.friends || []), req.user._id] },
      },
      {
        tags: { $in: [req.user._id] },
      },
    ],
  };
};
