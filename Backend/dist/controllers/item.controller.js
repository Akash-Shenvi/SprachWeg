"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItem = exports.getItems = void 0;
const item_model_1 = __importDefault(require("../models/item.model"));
const item_dto_1 = require("../dtos/item.dto");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const getItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield item_model_1.default.find();
        res.status(200).json(items);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getItems = getItems;
const createItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const itemDto = (0, class_transformer_1.plainToClass)(item_dto_1.CreateItemDto, req.body);
    const errors = yield (0, class_validator_1.validate)(itemDto);
    if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
    }
    try {
        const newItem = new item_model_1.default(req.body);
        const savedItem = yield newItem.save();
        res.status(201).json(savedItem);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.createItem = createItem;
