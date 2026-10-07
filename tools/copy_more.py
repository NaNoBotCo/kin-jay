"""copy_more.py — the second half of the words: Thailand, the groups, the legends, the glossary,
the pictures and the sources. Called from copy_text.py."""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
TH_WIKI = "https://th.wikipedia.org/wiki/เทศกาลกินเจ"
HCU = "https://has.hcu.ac.th/jspui/bitstream/123456789/3938/1/Big-Dipper-belief-and-Thai-Chinese-belief-ritual-of.pdf"
DN = "https://www.dailynews.co.th/news/6251835/"
DN_PKT = "https://www.dailynews.co.th/news/6253434/"
TSK_PKT = "https://www.thansettakij.com/lifestyle/670704"
TF = "https://thailandfoundation.or.th/phuket-vegetarian-festival/"
IARJ = "https://so03.tci-thaijo.org/index.php/IARJ/article/download/276454/185544"
NHB = "https://www.roots.gov.sg/en/ich-landing/ich/the-nine-emperor-gods-festival"

# per day: the scene, then [town, what] pairs
DAYPLAN = [
 ("pole", {"en": [("bkk", "Yaowarat opens, 16:00"), ("korat", "Shrine rites, 16:09"), ("phuket", "Nine lamps up on the pole since last night"), ("cm", "Guan Im foundation rites; J Food Festival at both Centrals")],
           "th": [("bkk", "เยาวราชเปิดงาน 16.00 น."), ("korat", "พิธีที่ศาลเจ้า 16.09 น."), ("phuket", "ยกเสาโกเต้ง ตะเกียงเก้าดวงขึ้นแล้วตั้งแต่เมื่อวาน"), ("cm", "พิธีที่มูลนิธิกวนอิมธรรมทาน งานเจที่เซ็นทรัลสองแห่ง")]}),
 ("sedan", {"en": [("phuket", "Naka shrine procession, 07:30")], "th": [("phuket", "ขบวนแห่อ๊ามนาคา 07.30 น.")]}),
 ("armies", {"en": [("phuket", "Sapam shrine procession, 07:00. At dusk: feeding the five heavenly armies")], "th": [("phuket", "ขบวนอ๊ามสะปำ 07.00 น. ค่ำ: เลี้ยงทหารห้าทัพ")]}),
 ("procession", {"en": [("phuket", "Sam Kong shrine, 06:45"), ("korat", "Procession through the city, 08:29")], "th": [("phuket", "อ๊ามสามกอง 06.45 น."), ("korat", "แห่อิ้วเก้งรอบเมือง 08.29 น.")]}),
 ("gather", {"en": [("phuket", "Tha Rua shrine, 06:09"), ("krabi", "Jay keepers gather on Maha Rat Road")], "th": [("phuket", "อ๊ามท่าเรือ 06.09 น."), ("krabi", "รวมพลคนกินเจ ถนนมหาราช")]}),
 ("lion", {"en": [("phuket", "Bang Niao shrine, 06:00"), ("hatyai", "Procession, lion and dragon dances"), ("korat", "Zodiac bridge crossing, 19:19")], "th": [("phuket", "อ๊ามบางเหนียว 06.00 น."), ("hatyai", "แห่รอบเมือง เชิดสิงโตมังกร"), ("korat", "ข้ามสะพานสิบสองนักษัตร 19.19 น.")]}),
 ("stars", {"en": [("phuket", "Jui Tui shrine, 08:00. Offering to the stars, about 20:00"), ("phangnga", "Procession")], "th": [("phuket", "อ๊ามจุ้ยตุ่ย 08.00 น. บูชาดาวราว 20.00 น."), ("phangnga", "แห่ขบวน")]}),
 ("firecrackers", {"en": [("phuket", "Kathu, the oldest shrine, 06:45")], "th": [("phuket", "อ๊ามกะทู้ อ๊ามเก่าที่สุด 06.45 น.")]}),
 ("sea", {"en": [("phuket", "Lo Rong shrine, 07:00. 22:30: the gods go to the sea at Saphan Hin"), ("all", "Jay ends at midnight")], "th": [("phuket", "อ๊ามหล่อโรง 07.00 น. 22.30 น. ส่งพระลงทะเลที่สะพานหิน"), ("all", "ออกเจหลังเที่ยงคืน")]}),
]

TOWNS = {  # lat, lng, icon, label offsets
 "cm": (18.788, 98.985, "mountain", "เชียงใหม่", "Chiang Mai", -30, 8, "right"),
 "cr": (19.907, 99.831, "clock", "เชียงราย", "Chiang Rai", 0, 14, "center"),
 "nsawan": (15.704, 100.137, "shrine", "นครสวรรค์", "Nakhon Sawan", -26, 6, "right"),
 "korat": (14.975, 102.098, "figures", "โคราช", "Korat", 0, 14, "center"),
 "bkk": (13.741, 100.51, "arch", "กรุงเทพฯ เยาวราช", "Bangkok, Yaowarat", -28, 6, "right"),
 "phangnga": (8.451, 98.526, "karst", "พังงา", "Phang Nga", 22, -10, "left"),
 "krabi": (8.063, 98.916, "karst", "กระบี่", "Krabi", 22, 0, "left"),
 "phuket": (7.885, 98.388, "shrine", "ภูเก็ต", "Phuket", 0, 16, "center"),
 "trang": (7.557, 99.611, "fire", "ตรัง", "Trang", 0, 14, "center"),
 "hatyai": (7.008, 100.474, "lion", "หาดใหญ่", "Hat Yai", -20, 6, "right"),
}
SEAS = {"en": [(10.2, 97.6, "Andaman Sea"), (11.4, 100.6, "Gulf of Thailand")], "th": [(10.2, 97.6, "ทะเลอันดามัน"), (11.4, 100.6, "อ่าวไทย")]}

# landmarks per map view: lat, lng, icon, th, en, size, dx, dy
LANDMARKS = {
 "city": [(18.7877, 98.9932, "gate", "ประตูท่าแพ", "Tha Phae Gate", 1, 14, -10, "left"),
          (18.7870, 98.9875, "chedi", "วัดเจดีย์หลวง", "Wat Chedi Luang", 1.2, 0, 0),
          (18.7902, 98.9874, "figures", "อนุสาวรีย์สามกษัตริย์", "Three Kings", 0.9, 0, -46),
          (18.7905, 99.0007, "market", "กาดหลวง", "Warorot", 1, 0, 0),
          (18.7840, 99.0040, "bridge", "ขัวเหล็ก", "Iron Bridge", 0.8, 0, 0),
          (18.7848, 99.0004, "market", "ไนท์บาซาร์", "Night Bazaar", 0.8, -4, 0),
          (18.7880, 98.9700, "mountain", "↖ ดอยสุเทพ", "↖ Doi Suthep", 1.1, 0, 0)],
 "cm": [(18.8049, 98.9221, "mountain", "ดอยสุเทพ", "Doi Suthep", 0.45, -14, 0, "right"),
        (18.5886, 98.4867, "peak", "ดอยอินทนนท์", "Doi Inthanon", 0.55, 0, 0),
        (19.398, 98.888, "peak", "ดอยหลวงเชียงดาว", "Doi Luang Chiang Dao", 0.5, 0, 0)],
 "cr": [(19.9074, 99.8309, "clock", "หอนาฬิกา", "Clock Tower", 0.8, 16, -4, "left"),
        (19.8243, 99.7630, "white", "วัดร่องขุ่น", "White Temple", 0.8, -18, 0, "right"),
        (20.3534, 100.0831, "triangle", "สามเหลี่ยมทองคำ", "Golden Triangle", 0.7, 16, -6, "left"),
        (20.4437, 99.8807, "bridge", "แม่สาย", "Mae Sai", 0.6, 0, -40),
        (20.3476, 99.8392, "peak", "ดอยตุง", "Doi Tung", 0.6, -16, -6, "right")],
 "crtown": [(19.9074, 99.8309, "clock", "หอนาฬิกา", "Clock Tower", 1.2, 0, 0),
            (19.9115, 99.8278, "chedi", "วัดพระแก้ว", "Wat Phra Kaew", 1, 0, 0),
            (19.9053, 99.8341, "market", "ไนท์บาซาร์", "Night Bazaar", 0.9, 0, 0),
            (19.9234, 99.8418, "chedi", "วัดร่องเสือเต้น", "Wat Rong Suea Ten", 0.9, 0, 0)],
}
MAPNOTES = {"en": {"city": [(18.800, 99.006, "Ping River"), (18.782, 98.976, "the moat", "#2f6fa0")], "crtown": [(19.925, 99.823, "Kok River")], "cm": [], "cr": []},
            "th": {"city": [(18.800, 99.006, "แม่น้ำปิง"), (18.782, 98.976, "คูเมือง", "#2f6fa0")], "crtown": [(19.925, 99.823, "แม่น้ำกก")], "cm": [], "cr": []}}

THAI_EVENTS = {
 "en": [
  ("Phuket", "9–18 Oct 2026", "The pole goes up 9 Oct at about 17:09; eight shrine processions, one a day, 11–18 Oct; fire-walking, the bridge-crossing and the send-off to the sea at Saphan Hin on the night of the 18th. On Thailand's national intangible-heritage list since 2018.", DN_PKT),
  ("Bangkok, Yaowarat", "9–18 Oct 2026", "At the Yaowarat arch: jay food down both sides of the road, palanquins from 22 Yaowarat shrines, road closed 10 Oct 16:00–22:00 for the opening.", "https://www.thansettakij.com/lifestyle/travel-shopping/670700"),
  ("Nakhon Ratchasima", "10–18 Oct 2026", "The 20th year at the Thao Suranari monument; procession 13 Oct, the twelve-zodiac bridge 15 Oct at 19:19.", "https://www.thansettakij.com/lifestyle/travel-shopping/670740"),
  ("Hat Yai, Songkhla", "9–18 Oct 2026", "More than 108 jay food shops at Suan Yom Suphasan Rangsan; city procession 15 Oct; lion and dragon dances 15–16 Oct.", DN),
  ("Trang", "10–18 Oct 2026", "Shrines across the province: charity kitchens, processions, fire-walking.", DN),
  ("Krabi", "10–18 Oct 2026", "Shrine rites and jay kitchens in town; the gathering of jay keepers on Maha Rat Road, 14 Oct.", DN),
  ("Phang Nga", "10–18 Oct 2026", "Nine shrines in nine days; procession 16 Oct.", DN_PKT),
  ("Nakhon Sawan", "October", "On the province's calendar at Na Pha shrine, Mueang.", DN),
  ("Nonthaburi", "9–18 Oct 2026", "A jay festival at Outlet Square, Muang Thong Thani.", DN),
 ],
 "th": [
  ("ภูเก็ต", "9–18 ต.ค. 2569", "ยกเสาโกเต้ง 9 ต.ค. ราว 17.09 น. ขบวนแห่แปดอ๊าม วันละอ๊าม 11–18 ต.ค. ลุยไฟ โก้ยห่าน และส่งพระลงทะเลที่สะพานหินคืนวันที่ 18 ขึ้นทะเบียนมรดกภูมิปัญญาทางวัฒนธรรมของชาติเมื่อปี 2561", DN_PKT),
  ("กรุงเทพฯ เยาวราช", "9–18 ต.ค. 2569", "ที่ซุ้มประตูเฉลิมพระเกียรติ อาหารเจสองฝั่งถนน ขบวนเกี้ยวจาก 22 ศาลเจ้าในเยาวราช ปิดถนน 10 ต.ค. 16.00–22.00 น. เปิดงาน", "https://www.thansettakij.com/lifestyle/travel-shopping/670700"),
  ("นครราชสีมา", "10–18 ต.ค. 2569", "ปีที่ 20 ที่ลานอนุสาวรีย์ท้าวสุรนารี แห่อิ้วเก้ง 13 ต.ค. ข้ามสะพานสิบสองนักษัตร 15 ต.ค. 19.19 น.", "https://www.thansettakij.com/lifestyle/travel-shopping/670740"),
  ("หาดใหญ่ สงขลา", "9–18 ต.ค. 2569", "ร้านอาหารเจกว่า 108 ร้าน ที่สวนหย่อมศุภสารรังสรรค์ แห่รอบเมือง 15 ต.ค. เชิดสิงโตและมังกร 15–16 ต.ค.", DN),
  ("ตรัง", "10–18 ต.ค. 2569", "ศาลเจ้าทั่วจังหวัด โรงทาน ขบวนแห่ ลุยไฟ", DN),
  ("กระบี่", "10–18 ต.ค. 2569", "พิธีที่ศาลเจ้าและร้านเจในเมือง รวมพลคนกินเจที่ถนนมหาราช 14 ต.ค.", DN),
  ("พังงา", "10–18 ต.ค. 2569", "เก้าศาลเจ้าเก้าวัน แห่ขบวน 16 ต.ค.", DN_PKT),
  ("นครสวรรค์", "ตุลาคม", "อยู่ในปฏิทินท่องเที่ยวของจังหวัด ที่ศาลเจ้าหน้าผา อำเภอเมือง", DN),
  ("นนทบุรี", "9–18 ต.ค. 2569", "เทศกาลเจที่เอาท์เล็ต สแควร์ เมืองทองธานี", DN),
 ],
}

GROUPS = {
 "en": [
  ("Shrine halls", "โรงเจ · ศาลเจ้า · อ๊าม", "They run the festival. Over a hundred Nine Emperor and Dou Mu temples in 20+ provinces, registered as charities.", HCU),
  ("Mahayana monks", "จีนนิกาย · อนัมนิกาย", "Chinese-lineage monks skip meat, egg, dairy and the pungent five. The Vietnamese-lineage Annam Nikaya: 27 temples, 3 monasteries.", "https://th.wikipedia.org/wiki/อนัมนิกาย"),
  ("Santi Asoke", "สันติอโศก", "Phra Bodhirak's movement, apart from the Sangha council since 1975. Strict vegetarian, one meal a day, 27 centres (2007), five in the north.", "https://aseas.univie.ac.at/index.php/aseas/article/download/2481/2070"),
  ("Yiguandao", "อนุตตรธรรม · 一貫道", "A Chinese religion from 1800s Shandong. Vegetarian eating is a core teaching.", "https://en.wikipedia.org/wiki/Yiguandao"),
  ("Thai Plum Village", "หมู่บ้านพลัม", "Thich Nhat Hanh's monastery at Pak Chong. Every meal vegetarian.", "https://www.thaiplumvillage.org/visitor-guide"),
  ("Sikh gurdwaras", "คุรุดวารา", "About twenty in Thailand. Phahurat's Siri Guru Singh Sabha feeds anyone a free vegetarian breakfast; Chiang Mai's dates from 1907.", "https://thailandmagazine.com/bangkok/temples/sikh-temple/"),
  ("Theravada laypeople", "ฆราวาส", "A sizeable minority eat vegetarian, Thailand and Sri Lanka above all.", "https://en.wikipedia.org/wiki/Buddhist_vegetarianism"),
 ],
 "th": [
  ("โรงเจ ศาลเจ้า", "โรงเจ · ศาลเจ้า · อ๊าม", "ผู้จัดเทศกาล วัดกิ๋วอ๋องไต่เต่และเต้าโบ้กว่าร้อยแห่งในกว่ายี่สิบจังหวัด จดทะเบียนเป็นมูลนิธิ", HCU),
  ("พระมหายาน", "จีนนิกาย · อนัมนิกาย", "พระสายจีนงดเนื้อ ไข่ นม และผักฉุนห้าอย่าง อนัมนิกายสายเวียดนามมีวัด 27 แห่ง สำนักสงฆ์ 3 แห่ง", "https://th.wikipedia.org/wiki/อนัมนิกาย"),
  ("สันติอโศก", "สันติอโศก", "สายของพระโพธิรักษ์ แยกจากมหาเถรสมาคมตั้งแต่ปี 2518 มังสวิรัติเคร่ง วันละมื้อ 27 ชุมชน (2550) ภาคเหนือห้าแห่ง", "https://aseas.univie.ac.at/index.php/aseas/article/download/2481/2070"),
  ("อนุตตรธรรม", "一貫道 อี้กวนเต้า", "ศาสนาจีนจากซานตงปลายศตวรรษที่ 19 กินมังสวิรัติเป็นคำสอนหลัก", "https://en.wikipedia.org/wiki/Yiguandao"),
  ("หมู่บ้านพลัม", "หมู่บ้านพลัม", "วัดสายท่านติช นัท ฮันห์ ที่ปากช่อง ทุกมื้อมังสวิรัติ", "https://www.thaiplumvillage.org/visitor-guide"),
  ("คุรุดวารา", "คุรุดวารา", "ในไทยราวยี่สิบแห่ง ศรีคุรุสิงห์สภา พาหุรัด เลี้ยงอาหารเช้ามังสวิรัติฟรีทุกคน คุรุดวาราเชียงใหม่ตั้งปี 2450", "https://thailandmagazine.com/bangkok/temples/sikh-temple/"),
  ("ฆราวาสเถรวาท", "ฆราวาส", "ส่วนน้อยที่ไม่น้อยกินมังสวิรัติ มากที่สุดในไทยและศรีลังกา", "https://en.wikipedia.org/wiki/Buddhist_vegetarianism"),
 ],
}

TALES = {
 "en": [
  ("The nine stars", "doctrine", ["The Nine Emperor Gods are the Big Dipper's seven stars plus two no one can see, sons of Dou Mu. Honour them, live longer.", "The Thai telling: seven past Buddhas and two bodhisattvas, the nine planets."], "https://en.wikipedia.org/wiki/Nine_Emperor_Gods_Festival"),
  ("The opera troupe at Kathu", "local tradition", ["Fever hits the tin mines of Kathu, Phuket. A Chinese opera troupe falls sick, blames its skipped vegetarian rites, keeps them, and recovers. The town follows.", "1825, says the governor; 1827, says Thai Wikipedia; after 1855, says a Chula thesis."], "https://www.thaipost.net/news-update/668677/"),
  ("The Ming loyalists", "folk legend", ["White-clad fighters eat no meat or pungent plants, chant spells against Manchu guns, and lose. The festival remembers them.", "A Huachiew study finds six versions across Thailand, Malaysia and Singapore."], HCU),
  ("The nine princes of Jiangxi", "folk legend", ["A leper beggar at rich Li Huakai's gate orders nine days of jay to stop a coming disaster. Li obeys, the town follows, the disaster passes."], TH_WIKI),
  ("Lao Seng's mother", "folk legend", ["A drunk dreams of his dead mother: she is happy on Mount Putuo because she ate only jay. He sets out, breaks his vow on the road, and still finds her floating above the incense pot."], TH_WIKI),
  ("Emperor Wu of Liang", "history", ["From 502 the Liang emperor eats one vegetarian meal a day and swaps the goats, pigs and cattle of the imperial sacrifice for animals moulded from flour."], "https://en.wikipedia.org/wiki/Emperor_Wu_of_Liang"),
  ("Devadatta's five rules", "Pali canon", ["Devadatta asks the Buddha to ban fish and meat for monks. The Buddha refuses; Devadatta splits the Sangha."], "https://en.wikipedia.org/wiki/Devadatta"),
 ],
 "th": [
  ("ดาวเก้าดวง", "คติความเชื่อ", ["กิ๋วอ๋องไต่เต่คือดาวหมีใหญ่เจ็ดดวงกับอีกสองดวงที่มองไม่เห็น โอรสของเต้าโบ้ บูชาแล้วอายุยืน", "ฉบับไทย: พระพุทธเจ้าในอดีตเจ็ดกับพระโพธิสัตว์สอง เท่ากับดาวนพเคราะห์"], "https://en.wikipedia.org/wiki/Nine_Emperor_Gods_Festival"),
  ("คณะงิ้วที่กะทู้", "ตำนานท้องถิ่น", ["ไข้ระบาดเหมืองดีบุกกะทู้ คณะงิ้วจีนป่วยตาม โทษว่าไม่ได้ทำพิธีกินผัก พอถือศีลก็หาย ชาวบ้านทำตาม", "ผู้ว่าฯ ว่า 2368 วิกิพีเดียว่า 2370 วิทยานิพนธ์จุฬาฯ ว่าหลัง 2398"], "https://www.thaipost.net/news-update/668677/"),
  ("นักรบราชวงศ์หมิง", "ตำนานพื้นบ้าน", ["หงี่หั่วท้วงนุ่งขาว งดเนื้องดผักฉุน ท่องคาถาสู้ปืนแมนจู แล้วแพ้ กินเจเพื่อระลึกถึงพวกเขา", "งานวิจัยหัวเฉียวฯ พบหกฉบับในไทย มาเลเซีย สิงคโปร์"], HCU),
  ("โอรสเก้าองค์แห่งกังไส", "ตำนานพื้นบ้าน", ["ขอทานโรคเรื้อนหน้าบ้านเศรษฐีลีฮั้วก่ายสั่งให้ถือศีลกินเจเก้าวันเพื่อพ้นภัย เศรษฐีทำ ชาวเมืองทำตาม ภัยก็ผ่านไป"], TH_WIKI),
  ("แม่ของเล่าเซ็ง", "ตำนานพื้นบ้าน", ["ขี้เมาฝันเห็นแม่ที่ตายไป แม่มีความสุขบนเขาโพถ้อซัวเพราะกินแต่เจ เขาออกเดินทาง ผิดสัญญากลางทาง แต่ก็เห็นแม่ลอยเหนือกระถางธูป"], TH_WIKI),
  ("จักรพรรดิเหลียงอู่ตี้", "ประวัติศาสตร์", ["ตั้งแต่ ค.ศ. 502 เสวยมังสวิรัติวันละมื้อ และเปลี่ยนแพะ หมู วัว ในพิธีเซ่นหลวงเป็นรูปสัตว์ปั้นจากแป้ง"], "https://en.wikipedia.org/wiki/Emperor_Wu_of_Liang"),
  ("ข้อเสนอของพระเทวทัต", "พระไตรปิฎก", ["พระเทวทัตทูลขอให้ห้ามพระฉันปลาและเนื้อ พระพุทธเจ้าไม่ทรงบังคับ พระเทวทัตจึงแยกสงฆ์"], "https://en.wikipedia.org/wiki/Devadatta"),
 ],
}

WORDS = {
 "en": [
  ("เจ", "jay · 齋", "Food with nothing from an animal and none of the five pungent plants; also the observance itself."),
  ("กินเจ", "kin jay · 食齋", "To keep jay. In Phuket the older word is chia chai, 'eat vegetables'."),
  ("ล้างท้อง", "lang thong", "The clean-out day before the nine days."),
  ("ออกเจ", "ok jay", "Coming out of jay after the last night."),
  ("โรงเจ", "rong jay", "A jay hall: a Chinese religious hall with its own kitchen."),
  ("อ๊าม", "am · 庵", "Phuket's word for a shrine."),
  ("โกเต้ง", "ko teng · 高燈", "The tall lantern pole raised to begin the festival, carrying the nine lamps."),
  ("กิ๋วอ๋องไต่เต่", "kiu ong tai te · 九皇大帝", "The Nine Emperor Gods."),
  ("ม้าทรง", "ma song", "A spirit medium, 'the horse the god rides'."),
  ("อิ้วเก้ง", "iu keng · 游境", "The procession that carries the gods through the streets."),
  ("โก้ยโห้ย", "koi hoi", "Fire-walking."),
  ("โก้ยห่าน", "koi han", "Crossing the bridge: a rite of cleansing at the shrine."),
  ("ผักฉุน", "phak chun", "The five pungent plants jay leaves out."),
  ("หมี่กึง", "mi kueng · 麵筋", "Wheat gluten, the base of jay pork and duck."),
  ("โปรตีนเกษตร", "protein kaset", "Textured soy protein, dried in chunks."),
  ("ปิ่นโต", "pinto", "A stacked tiffin carrier; shrine kitchens fill them during the festival."),
 ],
 "th": [
  ("เจ", "齋 jay", "อาหารที่ไม่มีของจากสัตว์และไม่มีผักฉุนห้าอย่าง หมายถึงการถือศีลด้วย"),
  ("กินเจ", "食齋 เจียะแจ", "ถือศีลกินเจ ที่ภูเก็ตใช้คำเก่าว่าเจี๊ยะฉ่าย คือกินผัก"),
  ("ล้างท้อง", "lang thong", "วันก่อนเริ่มกินเจหนึ่งวัน"),
  ("ออกเจ", "ok jay", "เลิกกินเจหลังคืนสุดท้าย"),
  ("โรงเจ", "rong jay", "หอบูชาของจีนที่มีครัวเจของตัวเอง"),
  ("อ๊าม", "庵 am", "คำภูเก็ตที่เรียกศาลเจ้า"),
  ("โกเต้ง", "高燈 ko teng", "เสาตะเกียงสูงที่ยกขึ้นเปิดเทศกาล แขวนตะเกียงเก้าดวง"),
  ("กิ๋วอ๋องไต่เต่", "九皇大帝", "เทพเจ้าเก้าองค์"),
  ("ม้าทรง", "ma song", "ร่างทรงของเทพ"),
  ("อิ้วเก้ง", "游境 iu keng", "ขบวนแห่เทพไปตามถนน"),
  ("โก้ยโห้ย", "koi hoi", "พิธีลุยไฟ"),
  ("โก้ยห่าน", "koi han", "พิธีข้ามสะพานสะเดาะเคราะห์ที่ศาลเจ้า"),
  ("ผักฉุน", "phak chun", "ผักห้าอย่างที่เจงด"),
  ("หมี่กึง", "麵筋", "แป้งสาลีกลูเตน ใช้ทำหมูเจ เป็ดเจ"),
  ("โปรตีนเกษตร", "TVP", "โปรตีนถั่วเหลืองอบแห้งเป็นชิ้น"),
  ("ปิ่นโต", "pinto", "ภาชนะซ้อนชั้น ช่วงเทศกาลโรงครัวศาลเจ้าตักอาหารใส่ให้"),
 ],
}

MORE = {
 "en": {
  "thai_kick": "Across Thailand", "thai_h": "Go: festivals across Thailand",
  "thai_p": ["Strongest where Hokkien and Teochew Thais settled: Phuket, the Andaman coast, Trang, Hat Yai, Yaowarat, Korat."],
  "groups_kick": "Who keeps it", "groups_h": "Who eats jay",
  "groups_p": [],
  "leg_kick": "Legends", "leg_h": "Legends",
  "leg_p": [],
  "dip_h": "Join the Dipper", "dip_p": ["Tap the seven stars in order, bowl to handle."],
  "dip_alt": "The seven stars of the Big Dipper; join them in order and two more appear",
  "dip_go": "Show me", "dip_start": "Tap the glowing star.", "dip_n": "{n} joined, {m} to go.",
  "dip_done": "Seven. The legend adds two that no one can see, to make nine: the Nine Emperor Gods.",
  "tofu_h": "Make tofu", "tofu_p": ["Legend credits Liu An, grandson of the first Han emperor: salted soy broth for his sick mother set into curds."],
  "tofu_alt": "Soybeans soaking, ground into milk, boiled, set into curds and pressed into a block of tofu",
  "tofu_names": ["Soak", "Grind", "Boil", "Set", "Press"],
  "tofu_steps": ["Soak the soybeans overnight until they swell.", "Grind them with water and strain off the milk.", "Boil the soy milk.", "Stir in a coagulant and the milk sets into curds.", "Press the curds in a cloth-lined box until they hold as a block."],
  "pic_kick": "Pictures", "pic_h": "The festival in pictures",
 },
 "th": {
  "thai_kick": "ทั่วไทย", "thai_h": "ไปงานกินเจทั่วไทย",
  "thai_p": ["คึกคักที่สุดในถิ่นคนไทยเชื้อสายฮกเกี้ยนและแต้จิ๋ว ภูเก็ต ฝั่งอันดามัน ตรัง หาดใหญ่ เยาวราช โคราช"],
  "groups_kick": "ใครกินเจ", "groups_h": "ใครกินเจ",
  "groups_p": [],
  "leg_kick": "ตำนาน", "leg_h": "ตำนาน",
  "leg_p": [],
  "dip_h": "ต่อดาวหมีใหญ่", "dip_p": ["แตะดาวเจ็ดดวงตามลำดับ จากกระบวยถึงปลายด้าม"],
  "dip_alt": "ดาวเจ็ดดวงของกลุ่มดาวหมีใหญ่ ต่อครบแล้วมีอีกสองดวงปรากฏ",
  "dip_go": "ต่อให้ดู", "dip_start": "แตะดาวที่กะพริบ", "dip_n": "ต่อแล้ว {n} ดวง เหลือ {m}",
  "dip_done": "ครบเจ็ด ตำนานเพิ่มอีกสองดวงที่ไม่มีใครเห็น รวมเป็นเก้า คือกิ๋วอ๋องไต่เต่",
  "tofu_h": "ทำเต้าหู้", "tofu_p": ["ตำนานว่าหลิวอาน หลานปฐมจักรพรรดิฮั่น ต้มน้ำถั่วใส่เกลือให้แม่ที่ป่วย แล้วน้ำถั่วจับเป็นก้อน"],
  "tofu_alt": "ถั่วเหลืองแช่น้ำ บดเป็นน้ำนม ต้ม จับตัวเป็นก้อน แล้วกดเป็นเต้าหู้",
  "tofu_names": ["แช่", "บด", "ต้ม", "จับตัว", "กด"],
  "tofu_steps": ["แช่ถั่วเหลืองค้างคืนจนพองตัว", "บดกับน้ำแล้วกรองเอาน้ำนมถั่ว", "ต้มน้ำเต้าหู้", "ใส่สารให้จับตัว น้ำนมถั่วจะจับเป็นก้อน", "ห่อผ้าใส่พิมพ์แล้วกดจนเป็นก้อน"],
  "pic_kick": "ภาพ", "pic_h": "เทศกาลในภาพ",
 },
}

SOURCES = [
 ("Thansettakij: กินเจ 2569, 10–18 ต.ค.", "https://www.thansettakij.com/lifestyle/travel-shopping/670317"),
 ("KTC: เทศกาลกินเจ", "https://www.ktc.co.th/article/lifestyle/misc/vegetarian-festival"),
 ("Bangkok Biz News: Phuket 2026 (7 Oct 2026)", "https://www.bangkokbiznews.com/economics/1255018"),
 ("Thansettakij: Phuket Vegetarian Festival 2569", TSK_PKT),
 ("Daily News: Phuket and Phang Nga 2569 schedules", DN_PKT),
 ("Daily News: 10 พิกัดงานกินเจ 2569", DN),
 ("Thansettakij: Yaowarat 2569", "https://www.thansettakij.com/lifestyle/travel-shopping/670700"),
 ("Thansettakij: Korat 2569", "https://www.thansettakij.com/lifestyle/travel-shopping/670740"),
 ("Kapook: ปฏิทิน ต.ค. 2570", "https://calendar.kapook.com/2570/october"),
 ("Thai PBS: กินเจ ผักฉุน ธงเจ", "https://www.thaipbs.or.th/now/content/426"),
 ("Thairath: กินเจ 2567", "https://www.thairath.co.th/lifestyle/culture/2488131"),
 ("Thairath: เมนูเจ 100 เมนู (2568)", "https://www.thairath.co.th/lifestyle/food/2886349"),
 ("Thairath: เมนูเจรายวัน (2564)", "https://www.thairath.co.th/lifestyle/food/1954405"),
 ("Thansettakij: 10 เมนูเจ (2566)", "https://www.thansettakij.com/lifestyle/travel-shopping/578481"),
 ("Daily News: เจกับมังสวิรัติ", "https://www.dailynews.co.th/articles/342284/"),
 ("วิกิพีเดีย: เทศกาลกินเจ", TH_WIKI),
 ("Wiktionary: 齋", "https://en.wiktionary.org/wiki/齋"),
 ("Wikipedia: Nine Emperor Gods Festival", "https://en.wikipedia.org/wiki/Nine_Emperor_Gods_Festival"),
 ("Singapore National Heritage Board: The Nine Emperor Gods Festival", NHB),
 ("Fan Jun (2019), Big Dipper belief and Thai-Chinese ritual, Huachiew Chalermprakiet University", HCU),
 ("Thai Post: Phuket festival, Ministry of Culture (2567)", "https://www.thaipost.net/news-update/668677/"),
 ("Phuket Rajabhat University: rites of the Phuket festival", IARJ),
 ("Thailand Foundation: Phuket Vegetarian Festival", TF),
 ("Chulalongkorn University thesis (2006)", "https://doi.nrct.go.th/ListDoi/listDetail/10.14457%2FCU.the.2006.1697"),
 ("Wikipedia: Emperor Wu of Liang", "https://en.wikipedia.org/wiki/Emperor_Wu_of_Liang"),
 ("Wikipedia: Devadatta", "https://en.wikipedia.org/wiki/Devadatta"),
 ("Wikipedia: Buddhist vegetarianism", "https://en.wikipedia.org/wiki/Buddhist_vegetarianism"),
 ("วิกิพีเดีย: อนัมนิกาย", "https://th.wikipedia.org/wiki/อนัมนิกาย"),
 ("Heikkilä-Horn, Santi Asoke, ASEAS", "https://aseas.univie.ac.at/index.php/aseas/article/download/2481/2070"),
 ("Wikipedia: Yiguandao", "https://en.wikipedia.org/wiki/Yiguandao"),
 ("Thai Plum Village: visitor guide", "https://www.thaiplumvillage.org/visitor-guide"),
 ("Thailand Magazine: Sikh temple, Bangkok", "https://thailandmagazine.com/bangkok/temples/sikh-temple/"),
 ("All About Sikhs: Gurdwara Sri Guru Singh Sabha, Chiang Mai", "https://www.allaboutsikhs.com/gurdwara-sri-guru-singh-sabhachiang-mai/"),
 ("วิกิพีเดีย: เต้าหู้", "https://th.wikipedia.org/wiki/เต้าหู้"),
 ("Wikipedia: Cap cai", "https://en.wikipedia.org/wiki/Cap_cai"),
 ("Wikipedia: Mee sua", "https://en.wikipedia.org/wiki/Mee_sua"),
 ("Chiang Mai News: มูลนิธิกวนอิมธรรมทาน 2569", "https://www.chiangmainews.co.th/social/4146691/"),
 ("The Thai Press: Thailand J Food Festival 2026", "https://www.thethaipress.com/2026/171849"),
 ("CMHY: Pung Tao Kong 2025", "https://www.cmhy.city/event/1618-You-are-invited-to-join-the-Vegetarian-Festival-at-the-Pung-Tao-Kong-Shrine-Chiang-Mai-2025"),
 ("Chiang Mai News: Pung Tao Kong 2566", "https://www.chiangmainews.co.th/news/chiangmai/3108670/"),
 ("Chiang Mai News: Warorot 2568", "https://www.chiangmainews.co.th/news/chiangmai/3797300/"),
 ("Chiang Mai News: Chiang Rai 2566", "https://www.chiangmainews.co.th/news/chiangrai/3114216/"),
 ("Chiang Mai News: ร้านเจเชียงใหม่ (2567)", "https://www.chiangmainews.co.th/eattravelrest/3457271/"),
 ("Panidhana 19(2), Chinese shrines of Mueang Chiang Mai (2023)", "https://so05.tci-thaijo.org/index.php/panidhana/article/view/265529"),
 ("Cultural Map of Thailand: Chiang Rai shrine", "https://dp.culturalmapthailand.info/CD-2564"),
 ("Wongnai: Chiang Mai Vegetarian Society", "https://www.wongnai.com/restaurants/9916QQ-%E0%B8%8A%E0%B8%A1%E0%B8%A3%E0%B8%A1%E0%B8%A1%E0%B8%B1%E0%B8%87%E0%B8%AA%E0%B8%A7%E0%B8%B4%E0%B8%A3%E0%B8%B1%E0%B8%95%E0%B8%B4%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88-%E0%B8%8A%E0%B8%A1%E0%B8%A3-%E0%B8%AA%E0%B8%B2%E0%B8%82%E0%B8%B2%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88"),
 ("Wongnai: Boonsita, Chiang Rai", "https://www.wongnai.com/restaurants/189236Bj-%E0%B8%9A%E0%B8%B8%E0%B8%8D%E0%B8%AA%E0%B8%B4%E0%B8%95%E0%B8%B2"),
 ("Lemon8: Kuang Meng Foundation free kitchen, Mae Sai (2025)", "https://www.lemon8-app.com/@viewolet/7563606336190841352?region=th"),
]


def more(UI):
    for lang in ("en", "th"):
        u = UI[lang]
        u.update(MORE[lang])
        names = {k: (v[3] if lang == "th" else v[4]) for k, v in TOWNS.items()}
        names["all"] = "ทั่วไทย" if lang == "th" else "Everywhere"
        u["dayplan"] = []
        for i, (scene, at) in enumerate(DAYPLAN):
            u["dayplan"].append({"scene": scene, "at": [[k, w] for k, w in at[lang] if k != "all"]})
            u["days"][i][1] = "<br>".join(f"<b>{names[k]}</b> {w}" for k, w in at[lang])
        u["towns"] = {k: {"lat": v[0], "lng": v[1], "icon": v[2], "name": v[3] if lang == "th" else v[4], "dx": v[5], "dy": v[6], "al": v[7]} for k, v in TOWNS.items()}
        u["seas"] = SEAS[lang]
        u["landmarks"] = {view: [{"lat": r[0], "lng": r[1], "icon": r[2], "name": r[3] if lang == "th" else r[4], "s": r[5], "dx": r[6], "dy": r[7], "al": r[8] if len(r) > 8 else "center"} for r in rows] for view, rows in LANDMARKS.items()}
        u["mapnotes"] = MAPNOTES[lang]
        u["thai_events"] = [{"name": a, "when": b, "what": c, "src": d} for a, b, c, d in THAI_EVENTS[lang]]
        u["groups"] = [{"name": a, "who": b, "what": c, "src": d} for a, b, c, d in GROUPS[lang]]
        u["tales"] = [{"name": a, "kind": b, "p": c, "src": d} for a, b, c, d in TALES[lang]]
        u["words"] = WORDS[lang]
    pf = os.path.join(HERE, "photos.json")
    photos = json.load(open(pf)) if os.path.exists(pf) else []
    return photos, SOURCES
