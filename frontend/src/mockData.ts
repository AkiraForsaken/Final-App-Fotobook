/**
 * mockData.ts
 * Central mock data store — swap individual arrays for real API calls later.
 */

import type { Photo, Album } from "./types/index.ts";

// Local images
import fernImage from "./assets/fern.jpeg"
import frierenImage from "./assets/frieren.jpeg"
import starkImage from "./assets/stark.jpeg"
import himmelImage from "./assets/himmel.jpeg"
import heiterImage from "./assets/heiter.jpeg"
import eisenImage from "./assets/eisen.jpeg"
import serieImage from "./assets/serie.jpeg"
import flammeImage from "./assets/flamme.jpeg"

// Authors

export const AUTHORS = {
  frieren: {
    id: 1,
    firstName: "Frieren",
    lastName: "The Mage",
    avatarUrl: frierenImage
  },
  fern: {
    id: 2,
    firstName: "Fern",
    lastName: "The Mage",
    avatarUrl: fernImage
  },
  stark: {
    id: 3,
    firstName: "Stark",
    lastName: "The Warrior",
    avatarUrl: starkImage
  },
  himmel: {
    id: 4,
    firstName: "Himmel",
    lastName: "The Hero",
    avatarUrl: himmelImage
  },
  heiter: {
    id: 5,
    firstName: "Heiter",
    lastName: "The Priest",
    avatarUrl: heiterImage
  },
  eisen: {
    id: 6,
    firstName: "Eisen",
    lastName: "The Warrior",
    avatarUrl: eisenImage
  },
  serie: {
    id: 7,
    firstName: "Serie",
    lastName: "The Living Grimmoir",
    avatarUrl: serieImage
  },
  flamme: {
    id: 8,
    firstName: "Flamme",
    lastName: "The Mage",
    avatarUrl: flammeImage
  },
};

// Feed Photos (shown only to followers)
// export the metadata without imageUrl so Feeds.tsx can merge them.

export const FEED_PHOTO_META: Photo[] = [
  {
    id: 1,
    title: "Magic in the Forest",
    description: "A serene view from our adventure in the ancient woods.",
    imageUrl: fernImage,
    sharingMode: "public",
    likesCount: 128,
    likedByMe: true,
    author: AUTHORS.fern,
    createdAt: "2024-06-10T09:00:00Z"
  },
  {
    id: 2,
    title: "Above the Clouds",
    description: "Portrait at sunset after a long day of traveling.",
    imageUrl: frierenImage,
    sharingMode: "public",
    likesCount: 214,
    likedByMe: false,
    author: AUTHORS.frieren,
    createdAt: "2024-06-09T17:30:00Z"
  },
  {
    id: 3,
    title: "Battle Ready",
    description: "Stark in his finest armor, just before the big fight.",
    imageUrl: starkImage,
    sharingMode: "public",
    likesCount: 89,
    likedByMe: false,
    author: AUTHORS.stark,
    createdAt: "2024-06-08T12:00:00Z"
  },
  {
    id: 4,
    title: "Eternal Hero",
    description: "Himmel posing for what he called 'posterity'.",
    imageUrl: himmelImage,
    sharingMode: "public",
    likesCount: 312,
    likedByMe: true,
    author: AUTHORS.himmel,
    createdAt: "2024-06-07T08:15:00Z"
  },
  {
    id: 5,
    title: "Morning Prayer",
    description: "Heiter at dawn, blessing the road ahead.",
    imageUrl: heiterImage,
    sharingMode: "public",
    likesCount: 55,
    likedByMe: false,
    author: AUTHORS.heiter,
    createdAt: "2024-06-06T06:00:00Z"
  },
  {
    id: 6,
    title: "Iron Fist",
    description: "Eisen practicing his craft at the forge.",
    imageUrl: eisenImage,
    sharingMode: "public",
    likesCount: 73,
    likedByMe: false,
    author: AUTHORS.eisen,
    createdAt: "2024-06-05T14:00:00Z"
  },
  {
    id: 7,
    title: "Spellweaving at Dusk",
    description: "An experimental spell gone beautifully wrong.",
    sharingMode: "public",
    imageUrl: "https://picsum.photos/736/736",
    likesCount: 99,
    likedByMe: false,
    author: AUTHORS.fern,
    createdAt: "2024-06-04T20:00:00Z"
  },
  {
    id: 8,
    title: "The Silent Summit",
    description: "After three days of climbing, silence was the reward.",
    imageUrl: "https://picsum.photos/736/736",
    sharingMode: "public",
    likesCount: 141,
    likedByMe: false,
    author: AUTHORS.stark,
    createdAt: "2024-06-03T07:45:00Z"
  },
  {
    id: 9,
    title: "Library of the Ancients",
    description: "Frieren browsing grimoires older than most civilizations.",
    imageUrl: "https://picsum.photos/736/736",
    sharingMode: "public",
    likesCount: 280,
    likedByMe: true,
    author: AUTHORS.frieren,
    createdAt: "2024-06-02T11:20:00Z"
  },
  {
    id: 10,
    title: "Campfire Tales",
    description: "Heiter's stories always lasted until sunrise.",
    imageUrl: "https://picsum.photos/736/736",
    sharingMode: "public",
    likesCount: 66,
    likedByMe: false,
    author: AUTHORS.heiter,
    createdAt: "2024-06-01T22:00:00Z"
  },
  {
    id: 11,
    title: "Forge Fire",
    description: "The glow of molten metal at midnight.",
    imageUrl: "https://picsum.photos/736/736",
    sharingMode: "public",
    likesCount: 48,
    likedByMe: false,
    author: AUTHORS.eisen,
    createdAt: "2024-05-31T23:30:00Z"
  },
  {
    id: 12,
    title: "Hero's Rest",
    description: "Even heroes need a nap.",
    imageUrl: "https://picsum.photos/736/736",
    sharingMode: "public",
    likesCount: 195,
    likedByMe: false,
    author: AUTHORS.himmel,
    createdAt: "2024-05-30T15:00:00Z"
  },
];

// Discovery Photos (all public posts from all users)

export const DISCOVERY_PHOTOS: Photo[] = [
  {
    id: 101,
    title: "Sage's Study",
    description: "Serie surrounded by floating tomes.",
    imageUrl: "https://picsum.photos/seed/p101/600/400",
    sharingMode: "public",
    likesCount: 334,
    likedByMe: false,
    author: AUTHORS.serie,
    createdAt: "2024-06-11T08:00:00Z"
  },
  {
    id: 102,
    title: "Flamme's Legacy",
    description: "A painting of the first great mage.",
    imageUrl: "https://picsum.photos/seed/p102/600/400",
    sharingMode: "public",
    likesCount: 512,
    likedByMe: false,
    author: AUTHORS.flamme,
    createdAt: "2024-06-11T06:30:00Z"
  },
  {
    id: 103,
    title: "Dawn Patrol",
    description: "Stark's early morning training runs.",
    imageUrl: "https://picsum.photos/seed/p103/600/400",
    sharingMode: "public",
    likesCount: 77,
    likedByMe: false,
    author: AUTHORS.stark,
    createdAt: "2024-06-10T05:00:00Z"
  },
  {
    id: 104,
    title: "Elven Twilight",
    description: "The forest at the hour between day and night.",
    imageUrl: "https://picsum.photos/seed/p104/600/400",
    sharingMode: "public",
    likesCount: 228,
    likedByMe: false,
    author: AUTHORS.frieren,
    createdAt: "2024-06-09T20:00:00Z"
  },
  {
    id: 105,
    title: "Parish Garden",
    description: "The priest tends his roses.",
    imageUrl: "https://picsum.photos/seed/p105/600/400",
    sharingMode: "public",
    likesCount: 42,
    likedByMe: false,
    author: AUTHORS.heiter,
    createdAt: "2024-06-09T09:00:00Z"
  },
  {
    id: 106,
    title: "Fern's Grimoire",
    description: "Every spell catalogued in perfect handwriting.",
    imageUrl: "https://picsum.photos/seed/p106/600/400",
    sharingMode: "public",
    likesCount: 155,
    likedByMe: false,
    author: AUTHORS.fern,
    createdAt: "2024-06-08T18:00:00Z"
  },
  {
    id: 107,
    title: "Himmel's Smile",
    description: "You could light a room with it.",
    imageUrl: "https://picsum.photos/seed/p107/600/400",
    sharingMode: "public",
    likesCount: 401,
    likedByMe: false,
    author: AUTHORS.himmel,
    createdAt: "2024-06-08T10:00:00Z"
  },
  {
    id: 108,
    title: "Eisen's Workshop",
    description: "Tools that have seen a hundred years of craft.",
    imageUrl: "https://picsum.photos/seed/p108/600/400",
    sharingMode: "public",
    likesCount: 88,
    likedByMe: false,
    author: AUTHORS.eisen,
    createdAt: "2024-06-07T16:00:00Z"
  },
  {
    id: 109,
    title: "Ancient Ruin",
    description: "What remains when empires forget themselves.",
    imageUrl: "https://picsum.photos/seed/p109/600/400",
    sharingMode: "public",
    likesCount: 191,
    likedByMe: false,
    author: AUTHORS.serie,
    createdAt: "2024-06-07T12:00:00Z"
  },
  {
    id: 110,
    title: "First Snow",
    description: "The village under a quiet winter sky.",
    imageUrl: "https://picsum.photos/seed/p110/600/400",
    sharingMode: "public",
    likesCount: 263,
    likedByMe: false,
    author: AUTHORS.flamme,
    createdAt: "2024-06-06T07:00:00Z"
  },
  {
    id: 111,
    title: "Market Day",
    description: "Fern haggling over spell reagents.",
    imageUrl: "https://picsum.photos/seed/p111/600/400",
    sharingMode: "public",
    likesCount: 109,
    likedByMe: false,
    author: AUTHORS.fern,
    createdAt: "2024-06-05T11:00:00Z"
  },
  {
    id: 112,
    title: "Stargazing",
    description: "Frieren counts constellations she has outlived.",
    imageUrl: "https://picsum.photos/seed/p112/600/400",
    sharingMode: "public",
    likesCount: 347,
    likedByMe: false,
    author: AUTHORS.frieren,
    createdAt: "2024-06-04T23:59:00Z"
  },
  {
    id: 113,
    title: "Warrior's Rest",
    description: "Stark, asleep with his axe still in hand.",
    imageUrl: "https://picsum.photos/seed/p113/600/400",
    sharingMode: "public",
    likesCount: 61,
    likedByMe: false,
    author: AUTHORS.stark,
    createdAt: "2024-06-03T15:30:00Z"
  },
  {
    id: 114,
    title: "Hymn at Midnight",
    description: "Heiter's voice carries further than you'd expect.",
    imageUrl: "https://picsum.photos/seed/p114/600/400",
    sharingMode: "public",
    likesCount: 74,
    likedByMe: false,
    author: AUTHORS.heiter,
    createdAt: "2024-06-02T00:15:00Z"
  },
  {
    id: 115,
    title: "The Last Relic",
    description: "Serie guards it. No one asks why.",
    imageUrl: "https://picsum.photos/seed/p115/600/400",
    sharingMode: "public",
    likesCount: 218,
    likedByMe: false,
    author: AUTHORS.serie,
    createdAt: "2024-06-01T09:00:00Z"
  },
  {
    id: 116,
    title: "Legacy of Fire",
    description: "The torch Flamme first lit still burns somewhere.",
    imageUrl: "https://picsum.photos/seed/p116/600/400",
    sharingMode: "public",
    likesCount: 430,
    likedByMe: false,
    author: AUTHORS.flamme,
    createdAt: "2024-05-31T18:00:00Z"
  },
  {
    id: 117,
    title: "Iron Meets Ice",
    description: "A duel in the northern wastes.",
    imageUrl: "https://picsum.photos/seed/p117/600/400",
    sharingMode: "public",
    likesCount: 139,
    likedByMe: false,
    author: AUTHORS.eisen,
    createdAt: "2024-05-30T12:00:00Z"
  },
  {
    id: 118,
    title: "Himmel's Crown",
    description: "They insisted. He wore it for five minutes.",
    imageUrl: "https://picsum.photos/seed/p118/600/400",
    sharingMode: "public",
    likesCount: 505,
    likedByMe: false,
    author: AUTHORS.himmel,
    createdAt: "2024-05-29T14:00:00Z"
  },
];

// Feed Albums ─────────────────────────────────────────────────────────────

export const FEED_ALBUMS: Album[] = [
  {
    id: 1,
    title: "Journey Through the North",
    description: "A collection of our travels across the northern frontier.",
    coverImageUrl: "https://picsum.photos/seed/album1/400/400",
    imageUrls: ["https://picsum.photos/seed/a1/400/400", "https://picsum.photos/seed/a2/400/400", "https://picsum.photos/seed/a3/400/400"],
    sharingMode: "public",
    likesCount: 45,
    likedByMe: false,
    author: AUTHORS.fern,
    createdAt: "2024-06-10T10:00:00Z",
  },
  {
    id: 2,
    title: "Memories of the Party",
    description: "Candid shots from our adventures together as a group.",
    coverImageUrl: "https://picsum.photos/seed/album2/400/400",
    imageUrls: ["https://picsum.photos/seed/b1/400/400", "https://picsum.photos/seed/b2/400/400", "https://picsum.photos/seed/b3/400/400", "https://picsum.photos/seed/b4/400/400"],
    sharingMode: "public",
    likesCount: 182,
    likedByMe: true,
    author: AUTHORS.himmel,
    createdAt: "2024-06-08T16:00:00Z",
  },
  {
    id: 3,
    title: "Forge & Flame",
    description: "A year in Eisen's workshop, captured in iron and light.",
    coverImageUrl: "https://picsum.photos/seed/album3/400/400",
    imageUrls: ["https://picsum.photos/seed/c1/400/400", "https://picsum.photos/seed/c2/400/400"],
    sharingMode: "public",
    likesCount: 67,
    likedByMe: false,
    author: AUTHORS.eisen,
    createdAt: "2024-06-06T09:00:00Z",
  },
  {
    id: 4,
    title: "Sacred Grounds",
    description: "Every temple Heiter has ever blessed, in one album.",
    coverImageUrl: "https://picsum.photos/seed/album4/400/400",
    imageUrls: ["https://picsum.photos/seed/d1/400/400", "https://picsum.photos/seed/d2/400/400", "https://picsum.photos/seed/d3/400/400"],
    sharingMode: "public",
    likesCount: 38,
    likedByMe: false,
    author: AUTHORS.heiter,
    createdAt: "2024-06-04T07:30:00Z",
  },
  {
    id: 5,
    title: "Thousand-Year Skies",
    description: "Frieren's personal sky archive. A millennium of sunsets.",
    coverImageUrl: "https://picsum.photos/seed/album5/400/400",
    imageUrls: ["https://picsum.photos/seed/e1/400/400", "https://picsum.photos/seed/e2/400/400", "https://picsum.photos/seed/e3/400/400", "https://picsum.photos/seed/e4/400/400"],
    sharingMode: "public",
    likesCount: 499,
    likedByMe: true,
    author: AUTHORS.frieren,
    createdAt: "2024-06-01T20:00:00Z",
  },
  {
    id: 6,
    title: "The Road Continues",
    description: "Stark documents every road they've walked so far.",
    coverImageUrl: "https://picsum.photos/seed/album6/400/400",
    imageUrls: ["https://picsum.photos/seed/f1/400/400", "https://picsum.photos/seed/f2/400/400"],
    sharingMode: "public",
    likesCount: 101,
    likedByMe: false,
    author: AUTHORS.stark,
    createdAt: "2024-05-29T11:00:00Z",
  },
];

// Discovery Albums ─────────────────────────────────────────────────────────

export const DISCOVERY_ALBUMS: Album[] = [
  {
    id: 201,
    title: "The Great Library",
    description: "Serie's personal archive of forbidden knowledge.",
    coverImageUrl: "https://picsum.photos/seed/da201/400/400",
    imageUrls: ["https://picsum.photos/seed/da201a/400/400", "https://picsum.photos/seed/da201b/400/400"],
    sharingMode: "public",
    likesCount: 278,
    likedByMe: false,
    author: AUTHORS.serie,
    createdAt: "2024-06-11T10:00:00Z",
  },
  {
    id: 202,
    title: "Flamme's Travels",
    description: "Before she became a legend, she was just a traveller.",
    coverImageUrl: "https://picsum.photos/seed/da202/400/400",
    imageUrls: ["https://picsum.photos/seed/da202a/400/400", "https://picsum.photos/seed/da202b/400/400", "https://picsum.photos/seed/da202c/400/400"],
    sharingMode: "public",
    likesCount: 391,
    likedByMe: false,
    author: AUTHORS.flamme,
    createdAt: "2024-06-09T14:00:00Z",
  },
  {
    id: 203,
    title: "Magic in Practice",
    description: "Fern's field notes, illustrated.",
    coverImageUrl: "https://picsum.photos/seed/da203/400/400",
    imageUrls: ["https://picsum.photos/seed/da203a/400/400", "https://picsum.photos/seed/da203b/400/400"],
    sharingMode: "public",
    likesCount: 144,
    likedByMe: false,
    author: AUTHORS.fern,
    createdAt: "2024-06-07T08:00:00Z",
  },
  {
    id: 204,
    title: "Battles We Won",
    description: "Himmel insisted on documenting every victory.",
    coverImageUrl: "https://picsum.photos/seed/da204/400/400",
    imageUrls: ["https://picsum.photos/seed/da204a/400/400", "https://picsum.photos/seed/da204b/400/400", "https://picsum.photos/seed/da204c/400/400", "https://picsum.photos/seed/da204d/400/400"],
    sharingMode: "public",
    likesCount: 463,
    likedByMe: false,
    author: AUTHORS.himmel,
    createdAt: "2024-06-05T16:00:00Z",
  },
  {
    id: 205,
    title: "Northern Wilds",
    description: "Eisen's solo expedition into uncharted mountain territory.",
    coverImageUrl: "https://picsum.photos/seed/da205/400/400",
    imageUrls: ["https://picsum.photos/seed/da205a/400/400", "https://picsum.photos/seed/da205b/400/400"],
    sharingMode: "public",
    likesCount: 82,
    likedByMe: false,
    author: AUTHORS.eisen,
    createdAt: "2024-06-03T10:00:00Z",
  },
  {
    id: 206,
    title: "Blessings and Beyond",
    description: "Heiter's travels to the most remote shrines.",
    coverImageUrl: "https://picsum.photos/seed/da206/400/400",
    imageUrls: ["https://picsum.photos/seed/da206a/400/400", "https://picsum.photos/seed/da206b/400/400"],
    sharingMode: "public",
    likesCount: 55,
    likedByMe: false,
    author: AUTHORS.heiter,
    createdAt: "2024-06-01T07:30:00Z",
  },
  {
    id: 207,
    title: "Stars and Spells",
    description: "A mage's guide to celestial magic.",
    coverImageUrl: "https://picsum.photos/seed/da207/400/400",
    imageUrls: ["https://picsum.photos/seed/da207a/400/400", "https://picsum.photos/seed/da207b/400/400", "https://picsum.photos/seed/da207c/400/400"],
    sharingMode: "public",
    likesCount: 317,
    likedByMe: false,
    author: AUTHORS.frieren,
    createdAt: "2024-05-30T22:00:00Z",
  },
  {
    id: 208,
    title: "Hero in Training",
    description: "Stark's first year as a proper adventurer.",
    coverImageUrl: "https://picsum.photos/seed/da208/400/400",
    imageUrls: ["https://picsum.photos/seed/da208a/400/400", "https://picsum.photos/seed/da208b/400/400"],
    sharingMode: "public",
    likesCount: 96,
    likedByMe: false,
    author: AUTHORS.stark,
    createdAt: "2024-05-28T13:00:00Z",
  },
  {
    id: 209,
    title: "Knowledge Preserved",
    description: "Serie cataloguing spells lost to time.",
    coverImageUrl: "https://picsum.photos/seed/da209/400/400",
    imageUrls: ["https://picsum.photos/seed/da209a/400/400", "https://picsum.photos/seed/da209b/400/400", "https://picsum.photos/seed/da209c/400/400"],
    sharingMode: "public",
    likesCount: 204,
    likedByMe: false,
    author: AUTHORS.serie,
    createdAt: "2024-05-26T09:00:00Z",
  },
  {
    id: 210,
    title: "Embers of the Past",
    description: "Flamme revisited, through those she inspired.",
    coverImageUrl: "https://picsum.photos/seed/da210/400/400",
    imageUrls: ["https://picsum.photos/seed/da210a/400/400", "https://picsum.photos/seed/da210b/400/400", "https://picsum.photos/seed/da210c/400/400"],
    sharingMode: "public",
    likesCount: 388,
    likedByMe: false,
    author: AUTHORS.flamme,
    createdAt: "2024-05-24T17:00:00Z",
  },
];