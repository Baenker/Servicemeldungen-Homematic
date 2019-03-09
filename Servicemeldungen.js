// jshint maxerr:3000
/**************************
* Verschickt eine Pushmittteilung bei auftretenden Servicemeldungen bei Homematic-Geräten
* 
* 28.01.19 V1.00    Erste Version
* 30.01.19 V1.01    Bei LowBAT Meldungen wird nun auch der Typ und somit die nötigen Batterien ermittelt
*                   UNREACH hinzugefügt
*                   STICKY_UNREACH hinzugefügt
*                   CONFIG_PENDING hinzugefügt
* 31.01.19 V1.02    Pushnachricht optimiert bei LOWBAT
* 01.02.19 V1.03    UPDATE_PENDING hinzugefügt
*                   DEVICE_IN_BOOTLOADER hinzugefügt
*                   ERROR hinzugefügt
*                   FAULT_REPORTING hinzugefügt
*                   Debugging erweitert
* 01.02.19 V1.04    Fehler behoben bei ERROR und FAULT_REPORTING
* 02.02.19 V1.05    Status Texte für ERROR und FAULT_Reporting hinzugefügt
*                   Pushmitteilung optimiert für ERROR und FAULT_Reporting
*                   Anpassung Debugtexte 
*                   Prio ist pro Fehlertyp einstellbar
* 03.02.19 V1.06    Batterien ermitteln in eigene function ausgelagert
*                   LOW_BAT aufgenommen
*                   SABOTAGE aufgenommen
*                   Neu Configmöglichkeit onetime für einmaliges prüfem
*                   Neue Configmöglichkeit observation für Dauerhafte Überwachung
*                   Fehler CONFIG_PENDING behoben
* 04.02.19 V1.07    Logging Fehler behoben
*                   Logging optimiert
*                   Es werden alle Homematic-Instanzen überprüft
*                   In der Konfig gibt es nun Variablen zum schreiben der Anzahl von Serviemeldungen //derzeit aber noch keine Nutzung
* 05.02.19 V1.08    Bei Sabotage wurde nicht die Variable für die Prio berücksichtigt
*                   geändert von Kanal 1 auf 0 var cacheSelectorSABOTAGE  = $('channel[state.id=hm-rpc.*.0.SABOTAGE_ALARM$]');
*                   Batterieliste aktualisiert
*                   Wenn Batterie nicht ermittelbar erfogt ein Hinweis im Log
*                   Neue Konfig Möglichkeit um Nachrichtentext in Objekte zu schreiben (erstmal Testweise nur in LOWBAT)
*                   Ergebnis in Datenfleder schreiben zum testen in LOWBAT eingefügt
* 06.02.19 V1.09    Serviemeldung ERROR_CODE aufgenommen
*                   Wenn Script manuell gestartet wurde wurde kein Ergebnis geloggt wenn eine Servicemeldung vorliegt und Debug = false war
*                   Logging optimiert
*                   Es wird keine Push mehr verschickt wenn eine Servicemeldung vorliegt und das Script manuell gestartet wird
* 07.02.19 V1.10    Function func_Batterie komplett umgeschrieben, da je nach Gerätetyp die falsche Batterie ermittelt werden konnte 
* 11.02.19 V1.11    Sticky_unreach Servicemeldungen werden bestätigt sofern in Konfiguration eingestellt
* 12.02.19 V1.12    Unterdrückung bei Cuxd Geräte kam die Meldung im Log das man sich melden soll wegen fehlenden Batterietyp
*                   Der aktuelle IST-Stand der Servicemeldungen lässt sich pro Typ in Objekte schreiben
* 13.02.19 V1.13    Push kann nun auch per Telegram verschickt werden
*                   Fehler Sticky_Unreach konnte nicht bestätigt werden
*                   Gesamtzahl aller Servicemeldungen kann in ein Objekt geschrieben werden z. B. für VIS
*                   neue Geräte in der Batterieliste hinzugefügt
*                   Überprüfung Batterietyp immer mit Großbuchstaben damit unterschiedliche Schreibweise kein Problem ist
*                   Korrektur Formatierung Pushnachricht
* 16.02.19 V1.14    Update Batterienliste
*                   Übersetzung Error_Code 1 für HmIP-SWD hinzugefügt
* 19.02.19 V1.15    Telegramtexte ohne font-Tag
*                   Update Batterieliste
* 26.02.19 V1,16    ERROR_NON_FLAT_POSITIONING_ALARM aufgenommen
*                   Update Batterieliste
*                   Bugfix Sabotagemeldung per Telegram
*                   neuer Paramter 'with_time' 
* 27.02.19 V.17     Fehler behoben wodurch das gesamte Script nicht richtig lief
*                   Batterieupdate
*                   Versand der Servicemeldung per e-Mail
* 03.03.19 V1.17a   Batterieupdate
*                   Fehler font behoben
*                   Logging optimiert wenn eine Servicemeldung mit observation = true passiert
* 04.03.19 V1.18    Warnhinweis im Script bei der Function Device_in_Bootloader entfernt
*                   Warnhinweis im Script bei der Function ERROR_NON_FLAT_POSITIONING entfernt
*                   Bisher wurde die Gerätebezeichnung nicht ermittelt wenn der Kanalname ohne "Doppeltpunkt Kanalnummer" beschriftet war
* 09.03.19 V1.19    User kann in Telegram benutzt werden
*                   Batterieupdate
**************************/
var logging = true;             //Sollte immer auf true stehen. Bei false wird garnicht protokolliert
var debugging = false;          //true protokolliert viele zusätzliche Infos

var autoAck = true;             //Löschen bestätigbarer Kommunikationsstörungen (true = an, false = aus)

var observation = true;        //Dauerhafte Überwachung der Geräte auf Servicemeldungen aktiv (true = aktiv // false =inaktiv)
var onetime = true;             //Prüft beim Script Start ob derzeit Geräte eine Servicemeldung haben
var with_time = false;           //Hängt die Uhrzeit an die Serviemeldung

//pro Fehlertyp kann eine andere Prio genutzt werden
var prio_LOWBAT = 0;
var prio_UNREACH = 0;
var prio_STICKY_UNREACH = 0;
var prio_CONFIG_PENDING = 0;
var prio_UPDATE_PENDING = 0;
var prio_DEVICE_IN_BOOTLOADER = 0;
var prio_ERROR = 0;
var prio_ERROR_CODE = 0;
var prio_FAULT_REPORTING = 0;
var prio_SABOTAGE= 0;
var prio_ERROR_NON_FLAT_POSITIONING = 0;

//Variablen für Servicemeldung in Objekt schreiben // Wenn einer Meldung auftritt wird diese in ein Textfeld geschrieben. Auf dieses kann man dann reagieren
//und z. B. die Nachricht per Telegram verschicken oder in vis anzeigen
var write_message = false;        // true schreibt beim auftreten einer Servicemeldung die Serviemeldung in ein Objekt
var id_Text_Servicemeldung = '';  // Objekt wo die Servicemeldung hingeschrieben werden soll

//Variablen für Pushover
var sendpush = true;            //true = verschickt per Pushover Nachrchten // false = Pushover wird nicht benutzt
var _prio;
var _titel;
var _message;
var _device = 'TPhone';         //Welches Gerät soll die Nachricht bekommen
//var _device = 'All'; 

//Variablen für Telegram
var sendtelegram = false;            //true = verschickt per Telegram Nachrchten // false = Telegram wird nicht benutzt
var user_telegram = '';             //User der die Nachricht bekommen soll

//Variable zum verschicken der Servicemeldungen per eMail
var sendmail = false;            //true = verschickt per email Nachrchten // false = email wird nicht benutzt

//Ergebnis in Datenfelder schreiben
var write_state = true;          //Schreibt die Ergebnisse der Servicemeldungen in Datenfelder. (true = schreiben, false, kein schreiben)
//nicht benutzte Felder einfach leer lassen --> var id_IST_XXX = '';
var id_IST_LOWBAT = 'Systemvariable.0.Servicemeldungen.Anzahl_LOWBAT'/*Anzahl LOWBAT*/;
var id_IST_LOW_BAT = '';
//var id_IST_G_LOWBAT = '';
var id_IST_UNREACH = "Systemvariable.0.Servicemeldungen.Anzahl_UNREACH"/*Anzahl_UNREACH*/;
var id_IST_STICKY_UNREACH = "Systemvariable.0.Servicemeldungen.Anzahl_STICKY_UNREACH"/*Anzahl_STICKY_UNREACH*/;
var id_IST_CONFIG_PENDING = '';
var id_IST_UPDATE_PENDING = '';
var id_IST_DEVICE_IN_BOOTLOADER = '';
var id_IST_ERROR = '';
var id_IST_ERROR_NON_FLAT_POSITIONING = '';
var id_IST_ERROR_CODE = '';
var id_IST_FAULT_REPORTING = '';
var id_IST_SABOTAGE = '';
var id_IST_Gesamt = "Systemvariable.0.Servicemeldungen.Anzahl_GESAMT"/*Anzahl_GESAMT*/;


//Ab hier eigentliches Script
//var cacheSelectorLOWBAT  = $('channel[state.id=hm-rpc.0.*.0.LOWBAT_ALARM$]');
var cacheSelectorLOWBAT  = $('channel[state.id=hm-rpc.*.0.LOWBAT_ALARM$]');
var cacheSelectorLOW_BAT  = $('channel[state.id=hm-rpc.*.0.LOW_BAT_ALARM$]');
var cacheSelectorUNREACH  = $('channel[state.id=hm-rpc.*.0.UNREACH_ALARM$]');
var cacheSelectorSTICKY_UNREACH  = $('channel[state.id=hm-rpc.*.0.STICKY_UNREACH_ALARM$]');
var cacheSelectorCONFIG_PENDING  = $('channel[state.id=hm-rpc.*.0.CONFIG_PENDING_ALARM$]');
var cacheSelectorUPDATE_PENDING  = $('channel[state.id=hm-rpc.*.0.UPDATE_PENDING_ALARM$]');
var cacheSelectorDEVICE_IN_BOOTLOADER  = $('channel[state.id=hm-rpc.*.0.DEVICE_IN_BOOTLOADER_ALARM$]');
var cacheSelectorERROR  = $('channel[state.id=hm-rpc.*.1.ERROR$]');
var cacheSelectorERROR_CODE  = $('channel[state.id=hm-rpc.*.ERROR_CODE$]');
var cacheSelectorFAULT_REPORTING  = $('channel[state.id=hm-rpc.*.4.FAULT_REPORTING$]');
var cacheSelectorSABOTAGE  = $('channel[state.id=hm-rpc.*.0.SABOTAGE_ALARM$]');
var cacheSelectorERROR_NON_FLAT_POSITIONING = $('channel[state.id=hm-rpc.*.0.ERROR_NON_FLAT_POSITIONING_ALARM$]');

function send_pushover_V4 (_device, _message, _titel, _prio) {
        var pushover_Instanz =  'pushover.0';
        if (_prio === 0){pushover_Instanz =  'pushover.0'}
        else if (_prio == 1){pushover_Instanz =  'pushover.1'}
        else if (_prio == 2){pushover_Instanz =  'pushover.2'}
        else {pushover_Instanz =  'pushover.3'}
        sendTo(pushover_Instanz, { 
        device: _device,
        message: _message, 
        title: _titel, 
        priority: _prio,
        retry: 60,
        expire: 600,
        html: 1
    }); 
}

function send_telegram (_message, user_telegram) {
    sendTo('telegram.0', { 
        text: _message,
        user: user_telegram,
        parse_mode: 'HTML'
    }); 

}

function send_mail (_message) {
    sendTo("email", {
        //from:    "iobroker@mydomain.com",
        //to:      "aabbcc@gmail.com",
        subject: "Servicemeldung",
        text:    _message
    });


}



function func_Batterie(native_type){
    var Batterie = 'unbekannt';
    var cr2016 = ['HM-RC-4', 'HM-RC-4-B', 'HM-RC-Key3', 'HM-RC-Key3-B', 'HM-RC-P1', 'HM-RC-Sec3', 'HM-RC-Sec3-B', 'ZEL STG RM HS 4'];
    var cr2032 = ['HM-PB-2-WM', 'HM-PB-4-WM', 'HM-PBI-4-FM', 'HM-SCI-3-FM', 'HM-Sec-TiS', 'HM-SwI-3-FM', 'HmIP-FCI1'];
    var lr14x2 = ['HM-Sec-Sir-WM', 'HM-OU-CFM-TW', 'HM-OU-CFM-Pl'];
    var lr44x2 = ['HM-Sec-SC', 'HM-Sec-SC2L', 'HM-Sec-SC-2', 'HM-Sec-RHS'];
    var lr6x2 = ['HM-CC-VD', 'HM-CC-RT-DN', 'HM-Sec-WDS', 'HM-Sec-WDS-2', 'HM-CC-TC', 'HM-Dis-TD-T', 'HB-UW-Sen-THPL-I', 'HM-WDS40-TH-I', 'HM-WDS40-TH-I-2', 'HM-WDS10-TH-O', 'HmIP-SMI', 'HMIP-eTRV', 'HM-WDS30-OT2-SM-2', 'HmIP-SMO', 'HmIP-SMO-A', 'HmIP-SPI', 'HmIP-eTRV-2', 'HmIP-SPDR', 'HmIP-SWD', 'HmIP-STHO-A', 'HmIP-eTRV-B', 'HmIP-PCBS-BAT','HmIP-STHO'];
    var lr6x3 = ['HmIP-SWO-PL', 'HM-Sec-MDIR', 'HM-Sec-MDIR-2', 'HM-Sec-SD', 'HM-Sec-Key', 'HM-Sec-Key-S', 'HM-Sec-Key-O', 'HM-Sen-Wa-Od', 'HM-Sen-MDIR', 'HM-Sen-MDIR-O', 'HM-Sen-MDIR-O-2', 'HM-WDS100-C6-O', 'HM-WDS100-C6-O-2', 'HM-WDS100-C6-O-2', 'HmIP-ASIR', 'HmIP-SWO-B'];
    var lr6x4 = ['HM-CCU-1', 'HM-ES-TX-WM', 'HM-WDC7000'];
    var lr3x1 = ['HM-RC-4-2', 'HM-RC-4-3', 'HM-RC-Key4-2', 'HM-RC-Key4-3', 'HM-RC-Sec4-2', 'HM-RC-Sec4-3', 'HM-Sec-RHS-2', 'HM-Sec-SCo', 'HmIP-KRC4', 'HmIP-KRCA', 'HmIP-RC8', 'HmIP-SRH', 'HMIP-SWDO', 'HmIP-DBB'];
    var lr3x2 = ['HM-TC-IT-WM-W-EU', 'HM-Dis-WM55', 'HM-Dis-EP-WM55', 'HM-PB-2-WM55', 'HM-PB-2-WM55-2', 'HM-PB-6-WM55', 'HM-PBI-2-FM', 'HM-RC-8', 'HM-Sen-DB-PCB', 'HM-Sen-EP', 'HM-Sen-MDIR-SM', 'HM-Sen-MDIR-WM55', 'HM-WDS30-T-O', 'HM-WDS30-OT2-SM', 'HmIP-STH', 'HmIP-STHD', 'HmIP-WRC2', 'HmIP-WRC6', 'HmIP-WTH', 'HmIP-WTH-2', 'HmIP-SAM', 'HmIP-SLO', 'HMIP-SWDO-I', 'HmIP-FCI6', 'HmIP-SMI55', 'HM-PB-2-FM', 'HmIP-SWDM'];
    var lr3x3 = ['HM-PB-4Dis-WM', 'HM-PB-4Dis-WM-2', 'HM-RC-Dis-H-x-EU', 'HM-Sen-LI-O'];
    var lr3x3a = ['HM-RC-19', 'HM-RC-19-B', 'HM-RC-12', 'HM-RC-12-B', 'HM-RC-12-W'];
    var lr14x3 = ['HmIP-MP3P'];
    var block9 = ['HM-LC-Sw1-Ba-PCB', 'HM-LC-Sw4-PCB', 'HM-MOD-EM-8', 'HM-MOD-Re-8', 'HM-Sen-RD-O', 'HM-OU-CM-PCB', 'HM-LC-Sw4-WM'];
    var fixed    = ['HM-Sec-SD-2', 'HmIP-SWSD'];
    var ohne = ['HM-LC-Sw1PBU-FM', 'HM-LC-Sw1-Pl-DN-R1', 'HM-LC-Sw1-DR', 'HM-LC-RGBW-WM', 'HM-LC-Sw1-Pl-CT-R1', 'HmIP-HEATING', 'HM-LC-Sw1-FM', 'HM-LC-Sw2-FM', 'HM-LC-Sw4-DR', 'HM-LC-Sw1-Pl', 'HM-LC-Sw1-Pl-2', 'HM-LC-Sw4-Ba-PCB', 'HM-LC-Sw1-SM', 'HM-LC-Sw4-SM', 'HM-Sys-sRP-Pl'];
    var recharge = ['HM-Sec-Win', 'HM-Sec-SFA-SM'];


    for (var i = 0; i < cr2016.length; i++) {
        if (cr2016[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '1x CR2016';
            break;
        }
    }
    for (i = 0; i < cr2032.length; i++) {
        if (cr2032[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '1x CR2032';
            break;
        }
    }
    for (i = 0; i < lr14x2.length; i++) {
        if (lr14x2[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '2x LR14';
            break;
        }
    }
    for (i = 0; i <lr44x2.length; i++) {
        if (lr44x2[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '2x LR44/AG13';
            break;
        }
    }
    for (i = 0; i <lr6x2.length; i++) {
        if (lr6x2[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '2x LR6/AA';
            break;
        }
    }
    for (i = 0; i < lr6x3.length; i++) {
        if (lr6x3[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '3x LR6/AA';
            break;
        }
    }
    for (i = 0; i < lr6x4.length; i++) {
        if (lr6x4[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '4x LR6/AA';
            break;
        }
    }
    for (i = 0; i < lr3x1.length; i++) {
        if (lr3x1[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '1x LR3/AAA';
            break;
        }
    }
    for (i = 0; i < lr3x2.length; i++) {
        if (lr3x2[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '2x LR3/AAA';
            break;
        }
    }
    for (i = 0; i < lr3x3.length; i++) {
        if (lr3x3[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '3x LR3/AAA';
            break;
        }
    }
    for (i = 0; i < lr3x3a.length; i++) {
        if (lr3x3a[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '3x AAA Akkus - bitte laden';
            break;
        }
    }

    for (i = 0; i < lr14x3.length; i++) {
        if (lr14x3[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '3x LR14/C';
            break;
        }
    }

    for (i = 0; i < block9.length; i++) {
        if (block9[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '9Volt Block leer oder unbestimmt';
            break;
        }
    }
    for (i = 0; i < fixed.length; i++) {
        if (fixed[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = 'Festbatterie leer';
            break;
        }
    }
    for (i = 0; i < ohne.length; i++) {
        if (ohne[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = 'ohne Batterie';
            break;
        }
    }
    for (i = 0; i < recharge.length; i++) {
        if (recharge[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = 'Akku entladen - bitte aufladen';
            break;
        }
    }

    return(Batterie);
   
}

function func_IST_Gesamt(){
    var IST_LOWBAT = 0;
    var IST_LOW_BAT = 0;
    var IST_UNREACH = 0;
    var IST_STICKY_UNREACH = 0;
    var IST_CONFIG_PENDING = 0;
    var IST_UPDATE_PENDING = 0;
    var IST_DEVICE_IN_BOOTLOADER = 0;
    var IST_ERROR = 0;
    var IST_ERROR_NON_FLAT_POSITIONING = 0;
    var IST_ERROR_CODE = 0;
    var IST_FAULT_REPORTING = 0;
    var IST_SABOTAGE = 0;
    var IST_Gesamt = 0;


    if(write_state){
        if(id_IST_LOWBAT !== ''){
             IST_LOWBAT = parseFloat(getState(id_IST_LOWBAT).val);    
        }
        if(id_IST_LOW_BAT !== ''){
            IST_LOW_BAT = parseFloat(getState(id_IST_LOW_BAT).val);
        }
        if(id_IST_UNREACH !== ''){
            IST_UNREACH = parseFloat(getState(id_IST_UNREACH).val);
        }
        if(id_IST_STICKY_UNREACH !== ''){
            IST_STICKY_UNREACH = parseFloat(getState(id_IST_STICKY_UNREACH).val);
        }
        if(id_IST_CONFIG_PENDING !== ''){
            IST_CONFIG_PENDING = parseFloat(getState(id_IST_CONFIG_PENDING).val);
        }
        if(id_IST_UPDATE_PENDING !== ''){
            IST_UPDATE_PENDING = parseFloat(getState(id_IST_UPDATE_PENDING).val);
        }
        if(id_IST_UPDATE_PENDING !== ''){
            IST_UPDATE_PENDING = parseFloat(getState(id_IST_UPDATE_PENDING).val);
        }
        if(id_IST_DEVICE_IN_BOOTLOADER !== ''){
            IST_DEVICE_IN_BOOTLOADER = parseFloat(getState(id_IST_DEVICE_IN_BOOTLOADER).val);
        }
        if(id_IST_ERROR !== ''){
            IST_ERROR = parseFloat(getState(id_IST_ERROR).val);
        }
        if(id_IST_ERROR_CODE !== ''){
             IST_ERROR_CODE = parseFloat(getState(id_IST_ERROR_CODE).val);
        }
        if(id_IST_FAULT_REPORTING !== ''){
            IST_FAULT_REPORTING = parseFloat(getState(id_IST_FAULT_REPORTING).val);
        }
        if(id_IST_SABOTAGE !== ''){
            IST_SABOTAGE = parseFloat(getState(id_IST_SABOTAGE).val);
        }
        
    
        if(id_IST_Gesamt === ''){
            if(debugging){
                log('Feld id_IST_Gesamt nicht ausgewählt');
            }
        }
        else{
            IST_Gesamt = IST_LOWBAT + IST_LOW_BAT + IST_UNREACH + IST_STICKY_UNREACH + IST_CONFIG_PENDING + IST_UPDATE_PENDING + IST_DEVICE_IN_BOOTLOADER + IST_ERROR + IST_ERROR_CODE + IST_FAULT_REPORTING + IST_SABOTAGE;
            if(debugging){
                log('Derzeitige Servicemeldungen: ' +IST_Gesamt +' --- Ergebnis in Objekt geschrieben');
            }
            setState(id_IST_Gesamt,IST_Gesamt);
        }


    }    
}

function LOWBAT(obj) {
    var meldungsart = 'LOWBAT';
    var Gesamt = 0;
    var Betroffen = 0;
    var text      = [];
    var _message_tmp = '';
    var _message_tmp1 = '';
    var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'Batterie ok';
        }
        else if (status == 1){
            status_text = 'Batterie niedrig';    
        }
        else if (status == 2){
            status_text = 'Batterie ok';    
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
    } 
    else {
        if(debugging){
            log('Function ' +meldungsart +' wird gestartet.'); 
        }
        log_manuell = true;
    } 

    cacheSelectorLOWBAT.each(function (id, i) {                         // Schleife für jedes gefundenen Element *.LOWBAT
        var status = getState(id).val;                                  
        var status_text;
        if(status === 0){
            status_text = 'Batterie ok';
        }
        else if (status == 1){
            status_text = 'Batterie niedrig';    
        }
        else if (status == 2){
            status_text = 'Batterie ok';    
        }
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        var Batterie = func_Batterie(native_type);
        var meldungsart = id.split('.')[4];
        
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                            // Zu Array hinzufügen
            _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Spannung Batterien/Akkus gering.</font> '+Batterie;
            _message_tmp1 = common_name +' ('+id_name +')' + ' - Spannung Batterien/Akkus gering. '+Batterie;
            if(with_time && datum_neu !== ''){
                _message_tmp = _message_tmp +datum_seit +datum_neu;
                _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
            }
           
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu +' ---' +Batterie);
        }
        //wenn Batterie unbekannt dann Log
        if(Batterie == 'unbekannt' && native_type !==''){
            log('Bitte melden: ' + common_name +' ('+id_name+') --- '+native_type +' --- Batterietyp fehlt im Script');
        }
        else{
            if(debugging){
                log('Keine Geräte mit unbekannter Batterie vorhanden');
            }
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ausgegeben
    if(Betroffen > 0){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
           
            }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = prio_LOWBAT;
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_LOWBAT){
                setState(id_IST_LOWBAT,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
        if(write_state){
            if(id_IST_LOWBAT){
                setState(id_IST_LOWBAT,0);
                func_IST_Gesamt();
                
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
    }
    
  
}

function LOW_BAT(obj) {
   var meldungsart = 'LOW_BAT';
   var native_type = '';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = '';
   var _message_tmp1 = '';
   var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'Batterie ok';
        }
        else if (status == 1){
            status_text = 'Batterie niedrig';    
        }
        else if (status == 2){
            status_text = 'Batterie ok';    
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
    } 
    else {
        if(debugging){
            log('Function ' +meldungsart +' wird gestartet.'); 
        }
        log_manuell = true;
    } 

    cacheSelectorLOW_BAT.each(function (id, i) {                         
        var status = getState(id).val;                                  
        var status_text;
        if(status === 0){
            status_text = 'Batterie ok';
        }
        else if (status == 1){
            status_text = 'Batterie niedrig';    
        }
        else if (status == 2){
            status_text = 'Batterie ok';    
        }
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        var Batterie = func_Batterie(native_type);
        var meldungsart = id.split('.')[4];
       
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                            // Zu Array hinzufügen
            _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Spannung Batterien/Akkus gering.</font> '+Batterie;
            _message_tmp1 = common_name +' ('+id_name +')' + ' - Spannung Batterien/Akkus gering. '+Batterie;
            if(with_time && datum_neu !== ''){
                _message_tmp = _message_tmp +datum_seit +datum_neu;
                _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
            }
           
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu +' ---' +Batterie);
        }
        //wenn Batterie unbekannt dann Log
        if(Batterie == 'unbekannt' && native_type !==''){
            log('Bitte melden: ' + common_name +' ('+id_name+') --- '+native_type +' --- Batterietyp fehlt im Script');
        }
        else{
            if(debugging){
                log('Keine Geräte mit unbekannter Batterie vorhanden');
            }
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ausgegeben
    if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = prio_LOWBAT;
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_LOW_BAT){
                setState(id_IST_LOW_BAT,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
            
        }
        if(write_state){
            if(id_IST_LOW_BAT){
                setState(id_IST_LOW_BAT,0);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
    }
    
  
}

function UNREACH(obj) {
   var meldungsart = 'UNREACH';
   var native_type = '';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = '';
   var _message_tmp1 = '';
   var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'keine Kommunikationsfehler';
        }
        else if (status == 1){
            status_text = 'Kommunikation gestört';    
        }
        else if (status == 2){
            status_text = 'Kommunikation war gestört';    
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
       
    } 
    else {
        if(debugging){
            log('Function ' +meldungsart +' wird gestartet.');  
        }
        log_manuell = true;
    }

    cacheSelectorUNREACH.each(function (id, i) {                         // Schleife für jedes gefundenen Element *.LOWBAT
        var status = getState(id).val;                                  // Zustand *.LOWBAT abfragen (jedes Element)
        var status_text;
        if(status === 0){
            status_text = 'keine Kommunikationsfehler';
        }
        else if (status == 1){
            status_text = 'Kommunikation gestört';    
        }
        else if (status == 2){
            status_text = 'Kommunikation war gestört';    
        }
        
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var meldungsart = id.split('.')[4];
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                            // Zu Array hinzufügen
            _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Kommunikation gestört.</font> '+'\n';
            _message_tmp1 = common_name +' ('+id_name +')' + ' - Kommunikation gestört.';
            if(with_time && datum_neu !== ''){
                _message_tmp = _message_tmp +datum_seit +datum_neu;
                _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
            }
           
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ) ausgegeben
    if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = prio_UNREACH;
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_UNREACH){
                setState(id_IST_UNREACH,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
        if(write_state){
            if(id_IST_UNREACH){
                setState(id_IST_UNREACH,0);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
    }
    
  
}

function STICKY_UNREACH(obj) {
   var meldungsart = 'STICKY_UNREACH';
   var native_type = '';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = '';
   var _message_tmp1 = '';
   var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'keine Kommunikationsfehler';
        }
        else if (status == 1){
            status_text = 'Kommunikation gestört';    
        }
        else if (status == 2){
            status_text = 'Kommunikation war gestört';    
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);    
    } 
    else {
        if(debugging){
            log('Function ' +meldungsart +' wird gestartet.');   
        }
        log_manuell = true;
            
    } 

    cacheSelectorSTICKY_UNREACH.each(function (id, i) {                         
        var status = getState(id).val;                                 
        var status_text;
        if(status === 0){
            status_text = 'keine bestätigbare Kommunikationsstörung vorhanden';
        }
        else if (status == 1){
            status_text = 'bestätigbare Kommunikationsstörung';    
        }
        else if (status == 2){
            status_text = 'bestätigbare Kommunikationsstörung wurde gelöscht';    
        }
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var meldungsart = id.split('.')[4];
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                            // Zu Array hinzufügen
            if(autoAck){
                setStateDelayed(id,2,5000);
                _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Meldung über bestätigbare Kommunikationsstörung gelöscht.</font> '+'\n';
                _message_tmp1 = common_name +' ('+id_name +')' + ' - Meldung über bestätigbare Kommunikationsstörung gelöscht. ';
                if(with_time && datum_neu !== ''){
                    _message_tmp = _message_tmp +datum_seit +datum_neu;
                    _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
                }
            }
            else {
                _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">bestätigbare Kommunikationsstörung.</font>';    
                _message_tmp1 = common_name +' ('+id_name +')' + ' - bestätigbare Kommunikationsstörung.'; 
                if(with_time && datum_neu !== ''){
                    _message_tmp = _message_tmp +datum_seit +datum_neu;
                    _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
                }
            }
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ausgegeben
    if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = 0; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_STICKY_UNREACH){
                setState(id_IST_STICKY_UNREACH,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
        if(write_state){
            if(id_IST_STICKY_UNREACH){
                setState(id_IST_STICKY_UNREACH,0);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
    }
    
  
}

function CONFIG_PENDING(obj) {
   var meldungsart = 'CONFIG_PENDING';
   var native_type = '';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = '';
   var _message_tmp1 = '';
   var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'keine Meldung';
        }
        else if (status == 1){
            status_text = 'Konfigurationsdaten stehen zur Übertragung an';    
        }
        else if (status == 2){
            status_text = 'Konfigurationsdaten standen zur Übertragung an';    
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
    } 
    else {
        if(debugging){
            log('Function ' +meldungsart +' wird gestartet.');  
        }
        log_manuell = true;
    } 

    cacheSelectorCONFIG_PENDING.each(function (id, i) {                         
        var status = getState(id).val;                                  
        var status_text;
        if(status === 0){
            status_text = 'keine Meldung';
        }
        else if (status == 1){
            status_text = 'Konfigurationsdaten stehen zur Übertragung an';    
        }
        else if (status == 2){
            status_text = 'Konfigurationsdaten standen zur Übertragung an';    
        }
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var meldungsart = id.split('.')[4];
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                            // Zu Array hinzufügen
            _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Konfigurationsdaten stehen zur Übertragung an.</font> '+'\n';
            _message_tmp1 = common_name +' ('+id_name +')' + ' - Konfigurationsdaten stehen zur Übertragung an. ';
            if(with_time && datum_neu !== ''){
                _message_tmp = _message_tmp +datum_seit +datum_neu;
                _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
            }
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ausgegeben
    if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = prio_UPDATE_PENDING; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_CONFIG_PENDING){
                setState(id_IST_CONFIG_PENDING,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
        if(write_state){
            if(id_IST_CONFIG_PENDING){
                setState(id_IST_CONFIG_PENDING,0);
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
    }
    
  
}

function UPDATE_PENDING(obj) {
   var meldungsart = 'UPDATE_PENDING';
   var native_type = '';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = '';
   var _message_tmp1 = '';
   var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'kein Update verfügbar';
        }
        else if (status == 1){
            status_text = 'Update verfügbar';    
        }
        else if (status == 2){
            status_text = 'Update wurde eingespielt';    
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
    }
    else {
        if(debugging){
            log('Function ' +meldungsart +' wird gestartet.');  
        }
        log_manuell = true;
    } 

    cacheSelectorUPDATE_PENDING.each(function (id, i) {                         
        var status = getState(id).val;                                  
        var status_text;
        if(status === 0){
            status_text = 'kein Update verfügbar';
        }
        else if (status == 1){
            status_text = 'Update verfügbar';    
        }
        else if (status == 2){
            status_text = 'Update wurde eingespielt';    
        }
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var meldungsart = id.split('.')[4];
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                           // Zu Array hinzufügen
            _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Update verfügbar.</font> '+'\n';
            _message_tmp1 = common_name +' ('+id_name +')' + ' - Update verfügbar. ';
            if(with_time && datum_neu !== ''){
                _message_tmp = _message_tmp +datum_seit +datum_neu;
                _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
            }
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ausgegeben
    if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = prio_UPDATE_PENDING; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_UPDATE_PENDING){
                setState(id_IST_UPDATE_PENDING,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
        if(write_state){
            if(id_IST_UPDATE_PENDING){
                setState(id_IST_UPDATE_PENDING,0);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
    }
    
  
}

function DEVICE_IN_BOOTLOADER(obj) {
   var meldungsart = 'DEVICE_IN_BOOTLOADER';
   var native_type = '';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = '';
   var _message_tmp1 = '';
   var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'Keine Meldung';
        }
        else if(status === 1){
            status_text = 'Gerät startet neu';
        }
        else if(status === 2){
            status_text = 'Gerät wurde neu getsartet';
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
    } 
    else {
        if(debugging){
            log('Function ' +meldungsart +' wird gestartet.');  
        }
        log_manuell = true;
    } 

    cacheSelectorDEVICE_IN_BOOTLOADER.each(function (id, i) {                         
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var meldungsart = id.split('.')[4];
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        var status = getState(id).val;                                  
        var status_text;
        if(status === 0){
            status_text = 'Keine Meldung';
        }
        else if(status === 1){
            status_text = 'Gerät startet neu';
        }
        else if(status === 2){
            status_text = 'Gerät wurde neu getsartet';
        }
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                           // Zu Array hinzufügen
            _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Gerät startet neu.</font> '+'\n';
            _message_tmp1 = common_name +' ('+id_name +')' + ' - Gerät startet neu.';
            if(with_time && datum_neu !== ''){
                _message_tmp = _message_tmp +datum_seit +datum_neu;
                _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
            }
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ausgegeben
    if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = prio_DEVICE_IN_BOOTLOADER; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_DEVICE_IN_BOOTLOADER){
                setState(id_IST_DEVICE_IN_BOOTLOADER,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
        if(write_state){
            if(id_IST_DEVICE_IN_BOOTLOADER){
                setState(id_IST_DEVICE_IN_BOOTLOADER,0);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
    }
    
  
}

function ERROR(obj) {
   var meldungsart = 'ERROR';
   var native_type = '';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = '';
   var _message_tmp1 = '';
   var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'Keinen Fehler';
        }
        else {
            status_text = meldungsart +' mit dem Wert: ' +status;    
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
    }
    else {
        if(debugging){
            log('Function ' +meldungsart +' wird gestartet.');  
        }
        log_manuell = true;
   } 

    cacheSelectorERROR.each(function (id, i) {                        
        var status = getState(id).val;                                  
        var status_text;
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var meldungsart = id.split('.')[4];
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        if((native_type == 'HM-Sec-RHS') || (native_type == 'HM-Sec-RHS-2') || (native_type == 'HM-Sec-SC') || (native_type == 'HM-Sec-SC-2') ||
        (native_type == 'HM-Sec-SCo') || (native_type == 'HM-Sec-MD') || (native_type == 'HM-Sec-MDIR') || (native_type == 'HM-Sec-MDIR-2')){
            if(status == 7){
                status_text = 'Sabotage';
            }
            else {
                status_text = 'ERROR mit dem Wert: ' +status;    
            }
        }
        else if ((native_type=='HM-Sec-Key') || (native_type=='HM-Sec-Key-S') || (native_type=='HM-Sec-Key-O')){
            if(status == 1){
                status_text = 'Einkuppeln fehlgeschlagen';
            }
            else if(status == 2){
                status_text = 'Motorlauf abgebrochen';
            }
            else {
                status_text = 'ERROR mit dem Wert: ' +status;    
            }
        }
        else if (native_type=='HM-CC-VD'){
            if(status == 1){
                status_text = 'Ventil Antrieb blockiert';
            }
            else if(status == 2){
                status_text = 'Ventil nicht montiert';
            }
            else if(status == 3){
                status_text = 'Stellbereich zu klein';
            }
            else if(status == 4){
                status_text = 'Batteriezustand niedrig';
            }
            else {
                status_text = 'ERROR mit dem Wert: ' +status;    
            }    
        }
        else {
                status_text = meldungsart +' mit dem Wert: ' +status;    
        }
        if (status > 0) {      // wenn Zustand größer 0, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                           // Zu Array hinzufügen
            _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">'+status_text +'.</font> '+'\n';
            _message_tmp1 = common_name +' ('+id_name +')' + ' - '+status_text;
            if(with_time && datum_neu !== ''){
                _message_tmp = _message_tmp +datum_seit +datum_neu;
                _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
            }
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ausgegeben
    if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = prio_ERROR; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_ERROR){
                setState(id_IST_ERROR,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
        if(write_state){
            if(id_IST_ERROR){
                setState(id_IST_ERROR,0);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
    }
    
  
}

function ERROR_CODE(obj) {
   var meldungsart = 'ERROR_CODE';
   var native_type = '';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = '';
   var _message_tmp1 = '';
   var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'Keinen Fehler';
        }
        
        else {
            status_text = meldungsart +' mit dem Wert: ' +status;    
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
    }
    else {
        if(debugging){
            log('Function ' +meldungsart +' wird gestartet.');  
        }
        log_manuell = true;
   } 

    cacheSelectorERROR_CODE.each(function (id, i) {                        
        var status = getState(id).val;                                  
        var status_text;
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var meldungsart = id.split('.')[4];
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        if(status === 0){
            status_text = 'Keinen Fehler';
        }
        else if(native_type == 'HmIP-SWD'){
            if(status == 1){
                status_text = 'Wassermelder wurde bewegt.';
            }
        }
        else {
            status_text = meldungsart +' mit dem Wert: ' +status;    
        }    
        
        if (status > 0) {      // wenn Zustand größer 0, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                           // Zu Array hinzufügen
            _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">'+status_text +'.</font> '+'\n';
            _message_tmp1 = common_name +' ('+id_name +')' + ' - '+status_text;
            if(with_time && datum_neu !== ''){
                _message_tmp = _message_tmp +datum_seit +datum_neu;
                _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
            }
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ausgegeben
    if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = prio_ERROR_CODE; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_ERROR_CODE){
                setState(id_IST_ERROR_CODE,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
        if(write_state){
            if(id_IST_ERROR_CODE){
                setState(id_IST_ERROR_CODE,0);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
    }
    
  
}

function FAULT_REPORTING(obj) {
   var meldungsart = 'FAULT_REPORTING';
   var native_type = '';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = '';
   var _message_tmp1 = '';
   var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'Keinen Fehler';
        }
        else {
            status_text = meldungsart +' mit dem Wert: ' +status;    
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
    } 
    else {
        if(debugging){
            log('Function wird gestartet. (FAULT_REPORTING)'); 
        }
        log_manuell = true;
   } 

    cacheSelectorFAULT_REPORTING.each(function (id, i) {                        
        var status = getState(id).val;                                  
        var status_text;
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var meldungsart = id.split('.')[4];
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        if(native_type == 'HM-CC-RT-DN'){
            if(status === 0){
                status_text = 'keine Störung';
            }
            else if(status == 1){
                status_text = 'Ventil blockiert';    
            }
            else if(status == 2){
                status_text = 'Einstellbereich Ventil zu groß';    
            }
            else if(status == 3){
                status_text = 'Einstellbereich Ventil zu klein';    
            }
            else if(status == 4){
                status_text = 'Kommunikationsfehler';    
            }
            else if(status == 6){
                status_text = 'Spannung Batterien/Akkus gering';    
            }
            else if(status == 7){
                status_text = 'Fehlstellung Ventil';    
            }
            else{
                status_text = meldungsart+' mit dem Wert: ' +status;        
            }
        }
        else{
            status_text = meldungsart+' mit dem Wert: ' +status;    
        }
        if (status > 0) {      // wenn Zustand größer 0, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                            // Zu Array hinzufügen
            _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">' +status_text +'.</font> '+'\n';
            _message_tmp1 = common_name +' ('+id_name +')' + ' - ' +status_text +'.';
            if(with_time && datum_neu !== ''){
                _message_tmp = _message_tmp +datum_seit +datum_neu;
                _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
            }
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status (Anzahl, davon FAULT_REPORTING zutreffend) ausgegeben
    if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = prio_FAULT_REPORTING; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_FAULT_REPORTING){
                setState(id_IST_FAULT_REPORTING,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
        if(write_state){
            if(id_IST_FAULT_REPORTING){
                setState(id_IST_FAULT_REPORTING,0);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
    }
    
  
}

function SABOTAGE(obj) {
   var meldungsart = 'SABOTAGE';
   var native_type = '';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = '';
   var _message_tmp1 = '';
   var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'Keine Sabotage';
        }
        else if(status === 1){
            status_text = 'Sabotage';
        }
        else if(status === 2){
            status_text = 'Sabotage aufgehoben';
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
    }
    else {
        if(debugging){
            log('Function ' +meldungsart +' wird gestartet.');  
        }
        log_manuell = true;
   } 

    cacheSelectorSABOTAGE.each(function (id, i) {                         
        var status = getState(id).val;                                  
        var status_text;
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var meldungsart = id.split('.')[4];
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        if(status === 0){
            status_text = 'Keine Sabotage';
        }
        else if(status === 1){
            status_text = 'Sabotage';
        }
        else if(status === 2){
            status_text = 'Sabotage aufgehoben';
        }
        if (status === 1) {      
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                           // Zu Array hinzufügen
            _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">' +status_text +'.</font> '+'\n';
            _message_tmp1 = common_name +' ('+id_name +')' + ' - ' +status_text +'.';
            if(with_time && datum_neu !== ''){
                _message_tmp = _message_tmp +datum_seit +datum_neu;
                _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
            }
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ausgegeben
    if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = prio_SABOTAGE; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_SABOTAGE){
                setState(id_IST_SABOTAGE,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
            
        }
        if(write_state){
            if(id_IST_SABOTAGE){
                setState(id_IST_SABOTAGE,0);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
    }
    
  
}

function ERROR_NON_FLAT_POSITIONING(obj) {
   var meldungsart = 'ERROR_NON_FLAT_POSITIONING';
   var native_type = '';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = '';
   var _message_tmp1 = '';
   var log_manuell = false;
   
   
    if (obj) {
        var common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        var status = obj.newState.val;                                 
        var status_text;
        if(status === 0){
            status_text = 'Keine Meldung';
        }
        else if(status === 1){
            status_text = 'Gerät wurde angehoben.';
        }
        else if(status === 2){
            status_text = 'Gerät wurde angehoben. Bestätigt';
        }
        var id_name = obj.id.split('.')[2];
        log('Neue Servicemeldung: ' +common_name +' ('+id_name +') ' +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
    } 
    else {
        if(debugging){
            log('Function ' +meldungsart +' wird gestartet.');  
        }
        log_manuell = true;
    } 

    cacheSelectorERROR_NON_FLAT_POSITIONING.each(function (id, i) {                         
        var obj    = getObject(id);
        //var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
        var common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        var id_name = id.split('.')[2];
        var meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text;
        if(status === 0){
            status_text = 'Keine Meldung';
        }
        else if(status === 1){
            status_text = 'Gerät wurde angehoben.';
        }
        else if(status === 2){
            status_text = 'Gerät wurde angehoben. Bestätigt.';
        }
        var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_neu;
        var datum_seit;
        if(datum < '01.01.71 01:00:00'){
            datum_seit = '';
            datum_neu = '';
        }else{
            datum_seit=  ' --- seit: ';
            datum_neu = datum +' Uhr';
        }
        var native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                           // Zu Array hinzufügen
            _message_tmp = common_name +' ('+id_name +')' + ' - <font color="red">wurde angehoben.</font> '+'\n';
            _message_tmp1 = common_name +' ('+id_name +')' + ' - wurde angehoben.';
            if(with_time && datum_neu !== ''){
                _message_tmp = _message_tmp +datum_seit +datum_neu;
                _message_tmp1 = _message_tmp1 +datum_seit +datum_neu;
            }
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ausgegeben
    if(Betroffen > 0){
       if(debugging || log_manuell){
           log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
       if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen für den Meldungstyp: ' +meldungsart +': '+ text.join(', '));
            }   
       }
       //Push verschicken
        if(sendpush && !log_manuell){
            _prio = prio_ERROR_NON_FLAT_POSITIONING; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
        if(sendtelegram && !log_manuell){
            _message = _message_tmp1;
            send_telegram(_message, user_telegram);
        }
        if(sendmail && !log_manuell){
            _message = _message_tmp1;
            send_mail(_message);
        }
        if(write_state){
            if(id_IST_ERROR_NON_FLAT_POSITIONING){
                setState(id_IST_ERROR_NON_FLAT_POSITIONING,Betroffen);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
        else{
            if(debugging){
                    log('Variable write_state steht auf false');
                    
                }    
        }
        if(write_message){
            if(id_Text_Servicemeldung){
                setState(id_Text_Servicemeldung,_message_tmp);    
            }    
        }
        else{
            if(debugging){
                log('Variable write_message steht auf false');
                    
            }     
        }
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
        if(write_state){
            if(id_IST_ERROR_NON_FLAT_POSITIONING){
                setState(id_IST_ERROR_NON_FLAT_POSITIONING,0);
                func_IST_Gesamt();
            }
            else{
                if(debugging){
                    log('id_IST Feld für '+meldungsart +' nicht gefüllt');
                    
                }    
            }
        
        }
    }
    
  
}

//Auslösen durch Zustandsänderung
if(observation){
    cacheSelectorLOWBAT.on(function(obj) {    
        LOWBAT(obj);
    });

    cacheSelectorLOW_BAT.on(function(obj) {    
        LOW_BAT(obj);
    });

    cacheSelectorUNREACH.on(function(obj) {   
        UNREACH(obj);
    });

    cacheSelectorSTICKY_UNREACH.on(function(obj) {    
        STICKY_UNREACH(obj);
    });

    cacheSelectorCONFIG_PENDING.on(function(obj) {    
        CONFIG_PENDING(obj);
    });

    cacheSelectorUPDATE_PENDING.on(function(obj) {    
        UPDATE_PENDING(obj);
    });

    cacheSelectorDEVICE_IN_BOOTLOADER.on(function(obj) {    
        DEVICE_IN_BOOTLOADER(obj);
    });   
    
    cacheSelectorERROR.on(function(obj) {    
        ERROR(obj);
    });  
    
    //cacheSelectorERROR_CODE.on(function(obj) {    
    //    ERROR_CODE(obj);
    //}); 
    
    cacheSelectorFAULT_REPORTING.on(function(obj) {    
        FAULT_REPORTING(obj);
    });
    cacheSelectorSABOTAGE.on(function(obj) {    
        SABOTAGE(obj);
    });
    cacheSelectorERROR_NON_FLAT_POSITIONING.on(function(obj) {    
        ERROR_NON_FLAT_POSITIONING(obj);
    }); 
}




if(onetime){
    //beim Start
    LOWBAT();
    LOW_BAT();
    UNREACH();
    STICKY_UNREACH();
    CONFIG_PENDING();
    UPDATE_PENDING();
    DEVICE_IN_BOOTLOADER();
    ERROR();
    //ERROR_CODE();
    FAULT_REPORTING();
    SABOTAGE();
    ERROR_NON_FLAT_POSITIONING();
}


