# CANLI GALAKSİ — Oyun Tasarım Belgesi

**Sürüm:** 0.1.0  
**Tarih:** 27 Eylül 2026  
**Durum:** İlk tasarım; prototip ve bot testleriyle revize edilecek  
**Platform:** Önce masaüstü tarayıcı; sonra mobil tarayıcı ve gerekirse uygulama  
**Tür:** Kalıcı evrenli, asenkron çok oyunculu uzay stratejisi  
**Ad:** Canlı Galaksi yalnızca çalışma adıdır; ürün adı ve marka ayrıca seçilecektir.

## 1. Tek cümlelik vaat

Gezegenlerini geliştir, keşfet, ittifak kur ve galaksiye filo gönder. Filolar canlı haritada hareket eder; sensörlerinle tehditleri fark eder, nakliyeleri korur, düşman filosunu yolda keser ve geçici stratejik röleler için mücadele edersin.

**Temel ayrım:** Harita, yapılmış emirlerin animasyonu değildir. Yeni bilgi ve karşı hamle fırsatı üreten ana oyun alanıdır.

### Oyuncu fantezisi

Oyuncu bir uzay imparatorunun bütün küçük işlemlerini değil, kritik kararlarını verir: Hangi gezegene yatırım yapacağım? Bu sevkiyata eskort ayırmalı mıyım? Görünür düşman filosu bir baskın mı, dikkat dağıtma hamlesi mi? Müttefikime yetişebilir miyim? Bir fırsat için kendi savunmamı açığa çıkarmaya değer mi?

### Hedef deneyim

- **İlk 10 dakika:** Oyuncu üretimi başlatır, ilk keşif filosunu gönderir ve sonuçla yeni bir karar verir.
- **Günlük 5–10 dakikalık ziyaret:** Üretim, filo hareketi ve uyarılar kontrol edilir; birkaç anlamlı emir verilir.
- **Uzun vadede:** Koloniler, teknolojiler, rakipler ve ittifak ilişkileri birikerek kişisel bir galaksi hikâyesi yaratır.
- **Yoğun an:** Sensör menzilindeki bir filonun niyetini eksik bilgiyle yorumlayıp varışından önce karar vermek.

Bu süreler denge hedefidir; garanti veya kullanımı zorlayacak zamanlayıcı değildir.

## 2. Tasarım ilkeleri ve Pareto sınırı

1. **Önce harita ve filo kararı.** Ekonomi, filoları neden ve nereye gönderdiğimize hizmet eder.
2. **Az seçenek, gerçek bedel.** Her geminin, kaynağın ve araştırmanın belirgin stratejik işi vardır.
3. **Canlılık, sürekli çevrimiçi olma zorunluluğu yaratmaz.** Çevrimdışı savunma çalışır; savaş sırasında refleks avantajı yoktur.
4. **Kaybetmek maliyetlidir, oyundan koparmaz.** Baskınlar sınırlı yağma ve filo kaybı yaratır; gelişmiş gezegenler silinmez.
5. **Bilgi bir kaynaktır.** Keşif, sensörler ve müttefik koordinasyonu salt savaş gücüne alternatif üretir.
6. **Botlarla sınanabilir kurallar.** Simülasyonun doğruluğu görsel istemciden bağımsızdır.

**İlk sürüm bütçesi:** 3 kaynak, 4 gemi rolü, 3 araştırma hattı, 5 temel görev, bir sektör, bir çekişmeli röle. Bu sayıların ötesindeki sistemler ancak bir tasarım sorununu çözdüklerinde eklenir.

### İlham ve özgün sınır

OGame'in kalıcı üretim, araştırma, koloni, filo ve ittifak döngüsü; Spacy'nin keşif ve enkaz gibi filo görevleri; Neptune's Pride'ın okunaklı haritası, kısmi görüşü ve diplomatik gerilimi incelenmiştir. Ürün kendi adını, sanatını, arayüzünü, evrenini, ilerleme eğrilerini, savaş kurallarını ve rota üzerinde önleme sistemini geliştirecektir. Mevcut oyunun ekranlarını, metinlerini, adlarını veya denge formüllerini kopyalamayız.

## 3. Bir oturumun somut akışı

1. Oyuncu ana ekranda gezegenlerini, görünür rotaları, uyarıları ve bekleyen kararları görür.
2. Üretim fazlasıyla cevher ocağını yükseltir veya yeni gemi üretir.
3. Yakındaki bilinmeyen sistemi keşfe gönderir. Harita filonun tahmini varışını ve yakıt bedelini gösterir.
4. Keşif, geri kazanılabilir bir sevkiyat bulur. Oyuncu nakliye filosu hazırlar; isterse avcı eskortu ekler.
5. Yol üzerindeki düşman filosu sensör menziline girer. Oyuncu yalnızca yönünü ve yaklaşık gücünü bilir.
6. Oyuncu sevkiyatı geri çevirir, yoluna devam eder veya hızlı avcılarla önleme emri verir.
7. Buluşma gerçekleşirse sunucu savaşı kısa turlarda çözer. Çevrimiçi izlenir; sonuç ve tekrar daha sonra da erişilebilir.
8. Sağ kalanlar döner. Enkaz haritada görünür. Sonuç bir sonraki yatırım, filo veya ittifak kararını doğurur.

**İlk oynama testi:** Öğretici bittikten sonra oyuncu haritadaki fırsat ya da tehdide bakarak kendi isteğiyle ikinci filo emrini veriyor mu?

## 4. Evren ve harita

### Yapı

- Evren, genişleyebilir **sektörlerden** oluşur. Her sektör yıldız sistemleri, gezegen yuvaları, uçuş hatları, keşif noktaları ve bir çekişmeli röle içerir.
- Başlangıç prototipi: yaklaşık **10–14 sistem**, sistem başına **3–5 gezegen yuvası**, **8–12 bot oyuncu** ve **bir röle**. Bunlar üretim hedefi değil, test varsayımlarıdır.
- Oyuncu bir ana gezegenle başlar. İlk evrede en çok iki ilave koloni kurabilir. Sınır ve açılma hızı testlerle belirlenir.
- Oyuncuya ait gelişmiş gezegenler normal saldırıyla fethedilmez. Boş yuvalar kolonileştirilir; röleler el değiştirir.
- Oyuncu yoğunluğu artınca yeni sektör eklenir. Boşluk yaratacak kadar büyük bir harita erkenden açılmaz.

### Uçuş hatları

Sistemler arasındaki bağlantılar haritada açıktır. Bir filo, seçilen yolun düğümleri boyunca ilerler. Hatlar rota seçimini, eskortu, sensör konumlandırmasını ve önlemeyi anlamlı kılar. İlk sürümde karmaşık serbest uzay navigasyonu yoktur.

- Filo emrinde **hedef, görev, gemiler, yük, rota, tahmini varış, yakıt ve olası risk** tek panelde gösterilir.
- İstemci bilinen başlangıç ve varış zamanlarından hareketi yumuşak çizer. Sunucu her görsel karede gemi konumu hesaplamaz.
- Bir yolun kesişmesi otomatik savaş başlatmaz. **Önleme**, açıkça verilen bir görevdir ve yetişme hesabı gönderimden önce gösterilir.
- Yanlışlıkla geri alınan riskin yok olmaması için filo, yolculuğun ilk kısmında yakıt maliyetiyle geri çağrılabilir; son yaklaşmada emir kilitlenir. Kesin eşik bot testlerinde belirlenecektir.

### Bilgi katmanları

| Bilgi seviyesi | Oyuncunun bildiği |
| --- | --- |
| Keşfedilmemiş | Sistemin yaklaşık konumu ve bağlantıları; içerik bilinmez. |
| Haritalanmış | Gezegen yuvaları, sahiplik ve röle varlığı. |
| Sensör teması | Düşman filosunun görünen rotası ve tahmini varışı. |
| Güçlü sensör/keşif | Yaklaşık filo büyüklüğü ve rol dağılımı; kesin yük ve emir hâlâ gizli olabilir. |
| Kendi/müttefik bilgisi | Kendi filolarında tam bilgi; müttefik verisi paylaşım iznine bağlı. |

Görüş dışındaki filolar sihirli biçimde kaybolmuş sanılmamalıdır: son görülen yer ve gözlem zamanı açıkça işaretlenir. Yanlış kesinlik, oyuncuya haksız bir karar verdirir.

## 5. Ekonomi ve gelişim

### Üç kaynak

| Kaynak | Ana kullanımı | Yarattığı karar |
| --- | --- | --- |
| **Cevher** | Yapılar, temel gemiler | Ekonomiyi mi, filoyu mu büyüteceğim? |
| **Kristal** | Araştırma ve ileri gemiler | Kısa vadeli güç mü, teknoloji mi? |
| **Yakıt** | Uçuş ve ileri üretim | Bu rota ve risk bedeline değer mi? |

Üretim çevrimdışı da sürer, depo dolunca durur. Elektrik gibi dördüncü bir sayılabilir kaynak MVP'de yoktur. Kaynaklara kesin oran ve süre formülleri bu belgede kilitlenmez; bot sonuçlarından türetilir.

### Yapılar

Üç üretim yapısı (cevher, kristal, yakıt), tersane, araştırma merkezi ve sensör dizisi ilk yapı setidir. Savunma, başlangıçta garnizondaki gemilerle sağlanır. Çok katmanlı savunma kuleleri ve gezegen yüzeyi bina yerleştirme ilk sürümde yoktur.

Bir yükseltmenin maliyeti, süresi ve üretime etkisi önceden okunur. İlk yükseltmeler birkaç dakikalık geri bildirim verir; ileri yükseltmeler uzun vadeli planlama yaratır. Aynı oyuncu için aynı anda sınırsız inşa veya araştırma kuyruğu açılmaz.

### Araştırma

- **Motor:** Menzil ve/veya hız; önlemenin mümkün olup olmadığını değiştirir.
- **Silah:** Çatışma etkinliği; filo bileşimini anlamsızlaştıracak düz hasar artışından kaçınılır.
- **Sensör:** Erken uyarı ve istihbarat ayrıntısı.

Araştırma bütün imparatorluğu etkiler. Her hatta az sayıda anlamlı eşik vardır; onlarca küçük yüzde artışı yoktur. Teknoloji yarışı tek doğru sıraya dönüşürse sistem yeniden dengelenir.

## 6. Filolar ve görevler

| Gemi | Temel iş | Güçlü yanı | Bedeli/zayıflığı |
| --- | --- | --- | --- |
| **Keşif** | Sistem ve filo bilgisi | Hız ve görüş | Düşük taşıma/savaş gücü |
| **Nakliye** | Kaynak, enkaz, koloni malzemesi | Yük kapasitesi | Korunmadığında kolay hedef |
| **Avcı** | Önleme ve eskort | Hız ve esneklik | Ağır savunmaya karşı maliyet |
| **Savaş gemisi** | Baskın ve hat savunması | Dayanıklılık ve güç | Yavaşlık ve yakıt |

**Bağlamsal görevler:** Keşfet; taşı/topla; saldır/önle; destekle; kolonileştir. Arayüz hedefe göre yalnızca uygulanabilir görevleri sunar. Kolonileştirme malzeme taşıyan nakliyeyle yapılır; ayrı koloni gemisi gerekmez. Enkazı nakliye toplar; ayrı kurtarma gemisi gerekmez.

Başlangıç görevleri NPC keşif noktalarıyla da çalışır. Bunlar gerçek oyuncu gibi sunulmaz; insan sayısı az olduğunda anlamlı karar sağlar.

## 7. Savaş ve önleme

### Savaşın belirleyicileri

Gemi bileşimi, sayı, araştırma, savunma konumu ve önceden seçilmiş emir sonucu belirler. Sunucu tek otoritedir. Çatışma, kısa turların olay kaydıyla çözülür; görsel tekrar aynı kaydı kullanır. Animasyon sonucu değiştirmez.

- **Gezegen baskını:** Savunmayla savaşılır; kazanan sınırlı miktarda korunmamış kaynak taşır. Yapılar kalıcı hasar almaz.
- **Filo önleme:** Sensörde görülen hedef filo için bir buluşma emri verilir. Hız ve rota uygun değilse emir verilemez; arayüz nedeni gösterir. Yetişirse iki filo hatta savaşır. Yük ve enkaz konumda kalır.
- **Röle çatışması:** Rölede bulunan garnizon ve gelen filo savaşır. Kontrol, kazanan tarafa geçer.
- **Müttefik desteği:** Zamanında varan müttefik filo savunmaya katılır. Zamanlama sonucu açıkça gösterilir.

Savaş sırasında oyuncunun çevrimiçi olması hasar, kaçınma veya hedef seçme bonusu sağlamaz. Çevrimiçi olan çatışmayı izler; çevrimdışı olan raporu ve aynı olaylardan üretilmiş tekrarı görür. Sonuç tahmin paneli kesin bilgi bilinmiyorsa aralık ve belirsizlik gösterir.

**Test edilecek çekirdek varsayım:** Önleme, keşif ve eskort birlikte ilginç bir risk üçgeni yaratır. Herkes yalnızca ağır filo kullanıyorsa gemi rolleri ve rota süreleri başarısızdır.

## 8. Röle ve rekabet

İlk sektörde **tek tarafsız röle** vardır. Kontrol eden oyuncu/ittifak çevrede daha geniş görüş ve haftalık kontrol puanı kazanır; doğrudan cevher, kristal veya yakıt üretimi kazanmaz. Röle bir başka filo tarafından geri alınabilir. Gezegenlerin kalıcı gelişimi sürerken haftalık sıralama sıfırlanır ve önceki sonuçlar arşivlenir.

Röle, savaş isteyen oyuncuya yıkıcı gezegen baskınlarının dışında bir hedef ve küçük ittifaka ortak amaç verir. Kontrolün kaç saat sürdüğü, görüşün yarıçapı, ele geçirme gecikmesi ve puan formülü test verileriyle ayarlanır. Oyuncunun bütün gece nöbet tutmasını gerektiren puan düzeni kabul edilmez.

İleride röle çeşitleri, sektörler arası hatlar ve sınırlı süreli kampanyalar düşünülebilir. İlk sürüm için tek bir anlaşılır röle yeterlidir.

## 9. İttifaklar ve sosyal oyun

İlk ittifak sistemi şunları sağlar: davet/kabul, üye listesi, basit özel mesaj, paylaşılan sensör teması ve **tek tıklamayla destek gönderme**. Eşzamanlı varış planlama aracı, ittifak kasası, teknoloji ticareti, roller ve ayrıntılı diplomasi daha sonraki sürümler içindir.

İttifak destek emri gönderen oyuncunun filosuna ve yakıtına gerçekten mal olur. Sadece üyelikten pasif üretim veya hasar bonusu verilmez. Sosyal fayda koordinasyonun kendisinden doğar.

## 10. Çevrimdışı adalet ve istismar sınırları

- Yeni oyuncu koruması çift yönlüdür: korunurken PvP saldırısı alamaz ve başlatamaz. Başlangıç varsayımı **48 saat veya belirli ilerleme eşiği**; bot ve insan testleriyle revize edilir.
- Baskınlarda korunmuş depo ve yağma tavanı vardır. Başlangıç deneme değeri, korunmamış stokun **en çok %20'si**; kesin denge değeri değildir.
- Aynı hedefe tekrarlanan saldırılar sınırlandırılır. Çok daha güçlü oyuncunun zayıf hedefe saldırısı engellenir veya ödülsüzleşir.
- Garnizon çevrimdışıyken de savaşır. Oyuncu önceden basit bir duruş seçebilir: **Konumu tut** veya **filoyu koru**. Bu iki seçeneğin ayrıntısı prototipte doğrulanır.
- Tatil modu kaynak ve kuyrukları dondurarak saldırıyı durdurur; hareket hâlindeki filolar ve yolda olan saldırılar için açık kurallar gerekir.
- Yaklaşan saldırı bildirimi seyrek, anlaşılır ve ayarlanabilirdir. Uyurken müdahale gerektiren bir oyun hedeflenmez.

Koruma sistemi riski sıfırlamaz: Açıkta tutulan kaynak, yanlış filo yatırımı, hatalı rota ve röle kaybı gerçek bedel taşır. Oyuncunun haftalarca biriktirdiği imparatorluğu tek gece içinde kaybetmesi hedef deneyim değildir.

## 11. Botlar: ilk oyuncular ve tasarım laboratuvarı

İlk oynanabilir evrenin katılımcıları botlar olacaktır. Botlar sadece hedefe giden komut dizileri değil, aynı gözlem–planlama–eylem katmanını kullanan farklı stratejistlerdir.

| Profil | Öncelik | Aradığı fırsat | Açık bıraktığı taraf |
| --- | --- | --- | --- |
| **Sanayici** | Üretim/araştırma | Güvenli büyüme ve verimli yatırım | Erken röle yarışı |
| **Akıncı** | İstihbarat/baskın | Zayıf nakliye ve açık depo | Uzun vadeli ekonomi |
| **Muhafız** | Savunma/ittifak | Önleme, eskort, röle kontrolü | Yavaş genişleme |
| **Kâşif** | Harita/koloni | Yeni yuva, keşif ödülü, bilgi | Gereğinden ince savunma |
| **Amiral** | Durumsal optimizasyon | Rakibe göre strateji değişimi | Tek alanda en yüksek uzmanlık |

### Karar modeli

Bot kendine izin verilen bilgiyi gözlemler, aday emirleri üretir ve her emir için yaklaşık **beklenen kazanç − kayıp riski − yakıt − zaman/fırsat maliyeti − misilleme riski** hesabı yapar. Eksik bilgiyi kesin veri yerine güven aralığı veya olasılık olarak tutar. Önceki savaş ve keşif sonuçları rakip hakkındaki tahmini günceller.

Botlar insan oyuncuyla **aynı komut doğrulamasından** geçer; gizli haritayı veya gerçek savaş sonucunu önceden okuyamaz. Normal test botları farklı karar gecikmeleri ve çevrimdışı aralıkları kullanır. Ayrı bir QA botu 7/24 oynayarak tekrar baskın, filo zamanlama ve kaynak aktarımı istismarlarını arar. QA botu olağan oyuncu davranışını temsil etmez.

**İlk uygulama sırası:** Sanayici, Akıncı, Muhafız, Kâşif; daha sonra Amiral ve istismar botu. LLM çağrısı çekirdek strateji için gerekli değildir: tekrar üretilebilir kararlar ve hızlandırılmış simülasyon önceliklidir. İleride LLM yalnızca açıklama, konuşma veya yeni senaryo önerisi için ayrı bir katmanda denenebilir.

### Hızlandırılmış test

- Aynı oyun kuralları normal zamanda ve ekransız hızlandırılmış zamanda çalışır.
- Harita tohumu, bot sürümü, başlangıç konumu, emirler ve sonuçlar kaydedilir; maç tekrar oynatılabilir.
- Botlar başlangıç konumlarını değiştirerek aynı haritada tekrar yarışır.
- İzlenen ölçüler: ikinci filo oranı; koloni zamanı; önleme denemesi ve başarısı; baskın kazancı/kaybı; filo çeşitliliği; röle el değiştirme; çevrimdışı oyuncunun toparlanması; stratejiye göre kazanma ve oyundan düşme oranı.
- Tek bir stratejinin her haritada kazanması, rölenin hiç el değiştirmemesi veya nakliyenin sistematik biçimde kullanılmaması yeniden tasarım işaretidir.

Botlar bug, dengesizlik ve sömürü bulur. Oyunun anlaşılır, heyecanlı ve tekrar oynanır olup olmadığı daha sonra küçük insan testleriyle doğrulanır.

## 12. Arayüz, görsel dil ve ses

**Ana ekran:** Canlı 2D galaksi; solda gezegenler ve üretim, sağda seçilen hedef ve verilebilecek emirler, üstte yalnızca üç kaynak ve en önemli uyarı. Haritada kendi filoları, bilinen düşman hareketleri, varış zamanları, görünür sensör alanı, keşif noktaları ve röle aynı görsel hiyerarşide okunur.

Görsel çekicilik ağır 3D varlıklardan değil; mesafe, ışık, iz, radar taraması ve yaklaşma hissinden gelir. Güzel animasyon karar verdiren bilgiyi gizlememelidir. Renk tek bilgi kanalı olmaz; ikon, çizgi tipi ve metin de kullanılır. Azaltılmış hareket tercihi desteklenir. Mobilde harita ve hedef paneli birbirinin üzerine yığılmadan tasarlanır; tam mobil optimizasyon ikinci teslim aşamasıdır.

Ses; sensör teması, varış, savaş ve geri dönüşü fark ettirir. Tekrarlanan üretim bildirimleri sessiz olabilir. Görsel tekrar kısa, atlanabilir ve anlaşılır bir olay özetiyle eşleşir.

## 13. Teknik tasarım ilkeleri

Başlangıç tercihi **Vercel üzerinde web uygulaması, Neon Postgres ve Neon Auth**. Canlı bağlantı/koordinasyon katmanı ayrıca değerlendirilecektir; Vercel WebSocket veya sektör bazlı bir gerçek zamanlı servis uygulanabilir. Seçim fiyat, bağlantı süresi, operasyon ve yük testinden sonra kilitlenir.

Asıl mimari karar **sunucu otoriter, istemciden bağımsız oyun motoru**dur:

- Emirler tek doğrulama yolundan geçer; insan, bot ve test istemcileri aynı kuralları kullanır.
- Oyun zamanı ve varışlar kalıcı olaylar olarak tutulur. Kapanan tarayıcı simülasyonu durdurmaz.
- İşlemler idempotenttir; yeniden denenen varış veya savaş iki kez kaynak üretmez.
- Harita animasyonu istemcide zaman damgalarından üretilir; hareketi görmek için her gemiden saniyede çok sayıda sunucu mesajı gelmez.
- Savaş motoru deterministik tohum ve olay günlüğüyle tekrar üretilebilir. Kayıt, hile incelemesi ve hata ayıklamaya da yarar.
- Gizli bilgi sunucuda filtrelenir; istemciye gönderilip yalnızca arayüzde saklanmaz.
- Dünya kuralları, içerik tabloları, bot politikaları ve görsel sunum ayrı modüllerdir. Sektör sayısı veya sunucu sağlayıcısı değişince temel oyun kuralı yeniden yazılmaz.

**Çalışma talimatı:** Always take concise notes of what you do, so we have an efficient and reliable code history memory.

## 14. Yol haritası ve kapsam kapıları

### A — Ekransız kurallar prototipi

Ekonomi, yükseltme, dört gemi, rota, beş görev, görüş, otomatik savaş, enkaz ve röle. Dört botla hızlandırılmış maçlar. Çıkış koşulu: maçlar tekrar üretilebilir; geçersiz emir ve çift işlenen olay yok; farklı bot stratejileri anlamlı sonuçlar doğurur.

### B — İzlenebilir sektör

2D harita, uçuş animasyonu, sensör bilgisi, önleme emri, savaş izlemesi ve tekrar. Bot maçlarını seyreden bir insan, bakarak neden bir filonun gönderildiğini ve savaşın sonucunu anlayabilmeli.

### C — Küçük insan testi

İnsan oyuncular botlarla aynı evrende oynar. İlk 10 dakika, ikinci gönüllü filo, ertesi gün dönüş, önleme anlaşılabilirliği ve çevrimdışı kayıp algısı gözlemlenir. Botlar açıkça bot olarak işaretlenir.

### D — İlk halka açık evren

Oturmuş koruma kuralları, basit ittifak, gözlemleme/raporlama araçları, performans ve ekonomi kontrolü. Kozmetik seçenekler düşünülebilir; hız, görüş veya kaynak satışı temel adaleti bozduğu için ilk gelir modeli değildir.

### Daha sonra açılabilecek kapılar

Yeni sektörler ve galaksiler; ittifak operasyon planı; ticaret; tarafsız fraksiyon olayları; farklı röle türleri; gemi varyantları; zaman sınırlı kampanyalar; modlanabilir keşif içerikleri; mobil uygulama. Her kapı, mevcut oyuncu davranışında belirlenen somut bir ihtiyaca bağlanır. Liste bir teslim sözü değildir.

## 15. Başlıca tasarım riskleri

| Risk | İlk önlem | Test sorusu |
| --- | --- | --- |
| Canlı harita yalnızca dekor olur | Sensör, eskort ve önleme kararını çekirdeğe koy | Oyuncu bir filo görünce emrini değiştiriyor mu? |
| Sürekli çevrimiçi olma baskısı | Asgari saldırı süresi, garnizon, sınırlı yağma, tekrar | Sekiz saat uzakta kalan toparlanabiliyor mu? |
| İlk güçlü ittifak evreni kilitler | Röle ekonomik üretim vermez; sınırlar test edilir | Röle el değiştiriyor mu? |
| Boş harita ve az oyuncu | Küçük sektör ve açıkça etiketli NPC keşifleri | İlk oturumda karar çıkıyor mu? |
| Akıncı nakliyeyi oyundan siler | Eskort ve güvenli rota seçimi; maliyet dengeleme | Nakliye gönderimi hâlâ rasyonel mi? |
| Aşırı koruma çatışmayı söndürür | Kayıp riski filoda, yükte ve rölede kalır | Baskın/önleme yeterince anlamlı mı? |
| Karmaşıklık ilk dakikayı boğar | Bağlamsal emir, tek harita, dört gemi | Yeni oyuncu ikinci emri kendi başına verebiliyor mu? |

## 16. Karar defteri: şimdi sabit olanlar ve açık sorular

**Sabit tasarım yönü:** Kalıcı imparatorluk; canlı fakat kısmi bilgili rota haritası; filo önleme; çevrimiçi refleks avantajı vermeyen savaş; sınırlı yıkım; ilk testlerde güçlü ve farklı botlar; hızlandırılmış aynı motor; küçük yoğun sektör.

**Açık ve test edilecek:** Kesin uçuş süreleri, depo koruma oranı, savaş hasar formülü, erken kolonilerin sayısı, rölenin görüş yarıçapı, filo geri çağırma eşiği, ittifak büyüklüğü, görev ödülleri, sezon/sıralama süresi, PvP güç eşleştirme sınırı ve gerçek zamanlı altyapı sağlayıcısı. Bu değerler prototip ve insan gözlemi olmadan nihai karar sayılmaz.

**Bir sonraki somut iş:** Ekransız oyun durumunu ve emir sözleşmelerini kur; dört botu aynı API'ye bağla; bir sektörde hızlandırılmış maçları ve izlenebilir olay günlüğünü çalıştır. Haritayı bu gerçek olay kaydının üstüne çiz.

## Referanslar

- OGame resmî tanıtımı: https://en.ogame.gameforge.com/ajax/main/info/
- Spacy oyun ve Codex: https://spacy.games/en ve https://spacy.games/en/codex/exploration/galaxy-map
- Neptune's Pride Triton Codex: https://triton.ironhelmet.com/help/intro ve https://triton.ironhelmet.com/help/map

Bu kaynaklar türü ve mevcut çözüm alanını anlamak içindir; bu belgedeki oyun kuralları öneridir.
