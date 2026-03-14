"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const item_controller_1 = require("../controllers/item.controller");
const router = (0, express_1.Router)();
router.get('/', item_controller_1.getItems);
router.post('/', item_controller_1.createItem);
exports.default = router;
