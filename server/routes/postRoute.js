import express from "express";
import { check, validationResult } from "express-validator";
import auth from "../middlewares/auth";

import User from "../models/User";
import Post from "../models/Post";

import multer from "multer";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
const postRoute = express.Router();

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    console.log(file.mimetype);

    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname);
    var allowedMimes = ["image/jpeg", "image/pjpeg", "image/png"];
    console.log(ext);
    if (allowedMimes.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb({ message: "파일 형식이 잘 못 되었습니다." }, false);
  }
}).single("file");

postRoute.post("/uploadfiles", (req, res) => {
  upload(req, res, function(error) {
    console.log(res.file, error);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.json({
      success: true,
      filePath: res.req.file.path,
      fileName: res.req.file.filename
    });
  });
});
postRoute.post("/thumbnail", (req, res) => {
  let thumbsFilePath = "";
  let fileDuration = "";

  // ffmpeg.ffprobe(req.body.filePath, function(err, metadata) {
  //   console.dir(metadata);
  //   console.log(metadata.format);

  //   fileDuration = metadata.format.duration;
  // });
  console.log(req.body);
  ffmpeg(req.body.filePath)
    .on("filenames", function(filenames) {
      console.log(`Will generate ${filenames.join(", ")}`);
      thumbsFilePath = `uploads/thumbnails/${filenames[0]}`;
    })
    .on("end", function() {
      console.log("Screenshots taken");
      return res.json({
        success: true,
        thumbsFilePath: thumbsFilePath,
        fileDuration: fileDuration
      });
    })
    .on("error", function(err) {
      console.error(err);
    })
    .screenshots({
      // Will take screens at 20%, 40%, 60% and 80% of the video
      count: 3,
      folder: "uploads/thumbnails",
      // %b input basename ( filename w/o extension )
      filename: "thumbnail-%b.png"
    });
});
postRoute.post(
  "/",
  [
    auth,
    [
      check("title", "제목이 필요합니다.")
        .not()
        .isEmpty(),
      check("description", "내용이 필요합니다.")
        .not()
        .isEmpty(),
      check("filePath", "파일을 선택해 주세요.")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ msg: errors.array() });
    try {
      const user = await User.findById(req.user).select("-password");
      console.log(req);
      const newPost = await new Post({
        user: req.user,
        title: req.body.title,
        filePath: req.body.filePath,
        duration: req.body.duration,
        thumbnail: req.body.thumbnail,
        description: req.body.description,
        name: user.name,
        avatar: user.avatar
      });
      const post = await newPost.save();

      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error - POST_POST");
    }
  }
);
postRoute.get("/all", async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error - GET_POSTS");
  }
});
postRoute.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error - GET_POSTS");
  }
});
postRoute.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "포스트를 찾을 수 없습니다." });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "포스트를 찾을 수 없습니다." });
    }
    res.status(500).send("Server Error - GET_POSTS");
  }
});
postRoute.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "포스트를 찾을 수 없습니다." });
    }
    if (post.user.toString() !== req.user) {
      return res.status(401).json({ msg: "글 작성자만 지울 수 있습니다." });
    }
    await post.remove();
    res.json({ msg: "포스트가 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "포스트를 찾을 수 없습니다." });
    }
    res.status(500).send("Server Error - GET_POSTS");
  }
});
postRoute.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (
      post.likes.filter(like => like.user.toString() === req.user).length > 0
    ) {
      return res.status(400).json({ msg: "이미 좋아요를 눌렀습니다." });
    }
    post.likes.unshift({ user: req.user });
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "포스트를 찾을 수 없습니다." });
    }
    res.status(500).send("Server Error");
  }
});
postRoute.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (
      post.likes.filter(like => like.user.toString() === req.user).length === 0
    ) {
      return res.status(400).json({ msg: "아직 좋아요를 누르지 않았습니다." });
    }

    //제거
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user);
    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "포스트를 찾을 수 없습니다." });
    }
    res.status(500).send("Server Error");
  }
});

postRoute.post(
  "/comment/:id",
  [
    auth,
    [
      check("text", "내용이 필요합니다.")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ Errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user).select("-password");
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user
      };
      await post.comments.unshift(newComment);
      await post.save();

      res.status(200).json(post.comments);
    } catch (error) {
      console.error(error.message);
      if (error.kind === "ObjectId") {
        return res.status(404).json({ msg: "포스트를 찾을 수 없습니다." });
      }
      res.status(500).send("Server Error");
    }
  }
);

postRoute.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const selectedComment = await post.comments.find(
      comment => comment._id.toString() === req.params.comment_id
    );
    //Make sure comment exists
    console.log(selectedComment);
    if (!selectedComment) {
      return res.status(404).json({ msg: "댓글이 존재하지 않습니다." });
    }
    console.log("여기요~");
    if (selectedComment.user.toString() !== req.user) {
      return res.status(401).json({ msg: "인증되지 않은 유저입니다." });
    }
    const removeIndex = post.comments
      .map(comment => comment._id)
      .indexOf(selectedComment._id);
    console.log(removeIndex);
    await post.comments.splice(removeIndex, 1);
    await post.save();
    res.status(200).json(post.comments);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "포스트를 찾을 수 없습니다." });
    }
    res.status(500).send("Server Error");
  }
});
export default postRoute;
