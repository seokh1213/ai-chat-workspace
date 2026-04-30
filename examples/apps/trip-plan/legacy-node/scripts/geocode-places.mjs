import fs from "node:fs/promises";

const placesPath = new URL("../data/places.js", import.meta.url);
const outputPath = new URL("../../geocode-results.json", import.meta.url);

const aliases = {
  g02: ["沖縄県国頭郡本部町備瀬462", "モコソルトコーヒー 本部町 沖縄", "moco salt coffee Motobu Okinawa"],
  g03: ["沖縄県国頭郡本部町新里247-1", "Ma-Blue Garden House Motobu Okinawa", "マーブルーガーデンハウス 沖縄"],
  g04: ["沖縄そば EIBUN 那覇", "Okinawa Soba Eibun Naha"],
  g05: ["沖縄県那覇市松尾2-8-35", "ポーたま 牧志市場 沖縄", "Potama Makishi Market Naha"],
  g06: ["スシロー 那覇国際通り店", "Sushiro Naha Kokusai Dori"],
  g07: ["沖縄県名護市呉我1335-4", "FIFI PARLOR Okinawa"],
  g08: ["魚まる 那覇", "Uomaru Naha Okinawa"],
  g09: ["沖縄県豊見城市瀬長174-6 #38", "MK CAFE ウミカジテラス 沖縄"],
  g10: ["沖縄県国頭郡本部町石川424 海洋博公園 沖縄美ら海水族館", "Ocean Blue Cafe Okinawa Churaumi Aquarium"],
  g11: ["沖縄県国頭郡本部町備瀬429-1", "カフェ チャハヤブラン 本部町", "Cafe CAHAYA BULAN Okinawa"],
  g12: ["A&W 那覇空港店", "A&W Naha Airport"],
  g13: ["沖縄県国頭郡本部町大浜881-1", "焼肉もとぶ牧場 もとぶ店", "Yakiniku Motobu Farm Motobu"],
  g14: ["沖縄県那覇市鏡水150 際内連結ターミナルビル3F", "ステーキハウス88 那覇空港店", "Steak House 88 Naha Airport"],
  g15: ["ジャッキーステーキハウス 那覇", "Jack's Steak House Naha"],
  g16: ["沖縄県中頭郡北谷町美浜9-1 デポアイランドビルC", "タコライスcafe きじむなぁ デポアイランド店", "Taco Rice Cafe Kijimuna Depot Island"],
  g17: ["沖縄県豊見城市瀬長174-6 瀬長島ウミカジテラス 28", "タコライスcafe きじむなぁ 瀬長島ウミカジテラス店", "Kijimuna Umikaji Terrace"],
  g18: ["沖縄県南城市玉城百名1360", "カリカ 南城市 沖縄", "Karika Nanjo Okinawa Nepal"],
  g19: ["浜辺の茶屋 南城市 沖縄", "Hamabe no Chaya Okinawa"],
  g20: ["沖縄県浦添市港川2-13-6 カンサスストリート40番", "鶏そば屋いしぐふー 港川店", "Torisobaya Ishigufu Okinawa"],
  g21: ["オハコルテ 港川本店", "oHacorte Okinawa"],
  g22: ["Ploughman's Lunch Bakery Okinawa", "プラウマンズ ランチ ベーカリー 沖縄"],
  g23: ["沖縄県中頭郡北中城村荻道150-3", "Sans Souci Okinawa cafe", "サンスーシィ 北中城 沖縄"],
  g24: ["Wagyu Cafe Kapuka Chatan Okinawa", "和牛カフェ カプカ 沖縄"],
  g25: ["Seaside Cafe Hanon Chatan Okinawa", "シーサイドカフェ ハノン 沖縄"],
  g26: ["ポークたまごおにぎり本店 那覇", "Pork Tamago Onigiri Naha"],
  g27: ["沖縄県中頭郡読谷村儀間560", "バンタカフェ 星野リゾート 読谷", "Banta Cafe by Hoshino Resorts Okinawa"],
  g28: ["沖縄県国頭郡本部町伊豆味2795-1", "Smilespoon Okinawa", "スマイルスプーン 沖縄"],
  g29: ["沖縄県国頭郡本部町伊豆味371-1", "農園茶屋 四季の彩 沖縄", "Nouen Chaya Shiki no Aya Okinawa"],
  g30: ["国頭港食堂 沖縄", "Kunigami Minato Shokudo"],
  g32: ["ザ・ビッグエクスプレス もとぶ店", "The Big Express Motobu Okinawa"],
  g33: ["沖縄県国頭郡恩納村恩納4484", "アポガマ 恩納村", "Apogama Okinawa"],
  g35: ["沖縄県那覇市松尾2-7-20", "Suehiro Blues Naha", "スエヒロブルース 那覇"],
  g36: ["レストランふりっぱー 名護", "Restaurant Flipper Nago Okinawa"],
  g37: ["沖縄県名護市運天原285", "Kurumaebi Kitchen TAMAYA Okinawa", "車えびキッチンTAMAYA 沖縄"],
  g38: ["ゆきの 食堂 沖縄", "Yukino restaurant Okinawa"],
  g39: ["スシロー 糸満西崎店", "Sushiro Itoman Nishizaki"],
  g40: ["沖縄県名護市大南2-11-3", "さっちゃんそば 沖縄", "Sacchan Soba Okinawa"],
  g41: ["沖縄県中頭郡北中城村字ライカム1 イオンモール沖縄ライカム店2階", "Standard Products イオンモール沖縄ライカム店"],
  g42: ["大泊ビーチ うるま", "Oodomari Beach Okinawa"],
  g43: ["ナゴパイナップルパーク", "Nago Pineapple Park"],
  g44: ["古宇利オーシャンタワー", "Kouri Ocean Tower"],
  g45: ["沖縄県国頭郡今帰仁村湧川661", "CASA SOL Okinawa cafe"],
  g46: ["備瀬崎 沖縄", "Bisezaki Okinawa"],
  g47: ["渡久地港 本部町", "Toguchi Port Motobu"],
  g48: ["古宇利ビーチ", "Kouri Beach"],
  g52: ["水納島 本部町 沖縄", "Minna Island Motobu Okinawa"],
  g53: ["ドン・キホーテ 国際通り店", "Don Quijote Kokusai Dori"],
  g54: ["やちむん喫茶シーサー園 沖縄", "Yachimun Kissa Shisaen Okinawa"],
  g55: ["百年古家 大家 名護", "Hyakunen Koga Ufuyā Nago"],
};

const text = await fs.readFile(placesPath, "utf8");
const places = JSON.parse(text.match(/= (\[[\s\S]*\]);/)[1]);
const results = {};

for (const place of places.filter((item) => !item.lat || !item.lng)) {
  const queries = aliases[place.id] || [`${place.name} Okinawa`];
  for (const query of queries) {
    const found = query.startsWith("沖縄県") ? await gsiAddress(query) : await nominatim(query);
    if (found) {
      results[place.id] = { ...found, query };
      break;
    }
    await delay(1100);
  }
  if (!results[place.id]) {
    results[place.id] = { query: queries[0], error: "not_found" };
  }
  await delay(1100);
}

await fs.writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
console.log(`wrote ${Object.keys(results).length} results to ${outputPath.pathname}`);

async function gsiAddress(query) {
  const url = new URL("https://msearch.gsi.go.jp/address-search/AddressSearch");
  url.searchParams.set("q", query);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "okinawa-trip-planner/0.1 local coordinate enrichment",
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`GSI ${response.status} for ${query}`);
  const [item] = await response.json();
  if (!item?.geometry?.coordinates) return null;
  const [lng, lat] = item.geometry.coordinates;
  return {
    lat: Number(lat),
    lng: Number(lng),
    displayName: item.properties?.title || query,
    osmType: "gsi",
    osmId: item.properties?.addressCode || "",
  };
}

async function nominatim(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("q", query);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "okinawa-trip-planner/0.1 local coordinate enrichment",
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`Nominatim ${response.status} for ${query}`);
  const [item] = await response.json();
  if (!item) return null;
  return {
    lat: Number(item.lat),
    lng: Number(item.lon),
    displayName: item.display_name,
    osmType: item.osm_type,
    osmId: item.osm_id,
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
