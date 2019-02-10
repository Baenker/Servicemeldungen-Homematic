// jshint maxerr:2000
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
**************************/
var logging = true;
var debugging = false;

var autoAck = false;             //Löschen bestätigbarer Kommunikationsstörungen (true = an, false = aus)

var observation = true;        //Dauerhafte Überwachung der Geräte auf Servicemeldungen aktiv (true = aktiv // false =inaktiv)
var onetime = true;             //Prüft beim Script Start ob derzeit Geräte eine Servicemeldung haben

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

//Variablen für Servicemeldung in Objekt schreiben // Wenn einer Meldung auftritt wird diese in ein Textfeld geschrieben. Auf dieses kann man dann reagieren
//und z. B. die Nachricht per Telegram verschicken oder in vis anzeigen
var write_message = true;        // true schreibt beim auftreten einer Servicemeldung die Serviemeldung in ein Objekt
var id_Text_Servicemeldung = '';

//Variablen für Pushover
var sendpush = true;            //true = verschickt per Pushover Nachrchten // false = Pushover wird nicht benutzt
var _prio;
var _titel;
var _message;
var _device = 'TPhone';         //Welches Gerät soll die Nachricht bekommen
//var _device = 'All'; 

//Ergebnis in Datenfelder schreiben
var write_state = true;          //Schreibt die Ergebnisse der Servicemeldungen in Datenfelder. (true = schreiben, false, kein schreiben)
//nicht benutzte Felder einfach leer lassen --> var id_IST_XXX = '';
var id_IST_LOWBAT = 'Systemvariable.0.Servicemeldungen.Anzahl_LOWBAT'/*Anzahl LOWBAT*/;
var id_IST_LOW_BAT = '';
var id_IST_G_LOWBAT = '';
var id_IST_UNREACH = '';
var id_IST_STICKY_UNREACH = '';
var id_IST_CONFIG_PENDING = '';
var id_IST_UPDATE_PENDING = '';
var id_IST_DEVICE_IN_BOOTLOADER = '';
var id_IST_ERROR = '';
var id_IST_ERROR_CODE = '';
var id_IST_FAULT_REPORTING = '';
var id_IST_SABOTAGE = '';
var id_IST_Gesamt = '';


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

function func_Batterie(native_type){
    var Batterie = 'unbekannt';
    var cr2016 = ['HM-RC-4', 'HM-RC-4-B', 'HM-RC-Key3', 'HM-RC-Key3-B', 'HM-RC-P1', 'HM-RC-Sec3', 'HM-RC-Sec3-B', 'ZEL STG RM HS 4'];
    var cr2032 = ['HM-PB-2-WM', 'HM-PB-4-WM', 'HM-PBI-4-FM', 'HM-SCI-3-FM', 'HM-Sec-TiS', 'HM-SwI-3-FM', 'HmIP-FCI1'];
    var lr14x2 = ['HM-Sec-Sir-WM', 'HM-OU-CFM-TW'];
    var lr44x2 = ['HM-Sec-SC', 'HM-Sec-SC2LHM-Sec-SC-2', 'HM-Sec-RHS'];
    var lr6x2 = ['HM-CC-VD', 'HM-CC-RT-DN', 'HM-Sec-WDS', 'HM-Sec-WDS-2', 'HM-CC-TC', 'HM-Dis-TD-T', 'HB-UW-Sen-THPL-I', 'HM-WDS40-TH-I', 'HM-WDS40-TH-I-2', 'HM-WDS10-TH-O', 'HmIP-SMI', 'HMIP-eTRV', 'HM-WDS30-OT2-SM-2', 'HmIP-SMO', 'HmIP-SMO-A', 'HmIP-SPI', 'HmIP-eTRV-2', 'HmIP-SPDR', 'HmIP-SWD', 'HmIP-STHO-A'];
    var lr6x3 = ['HmIP-SWO-PL', 'HM-Sec-MDIR', 'HM-Sec-MDIR-2', 'HM-Sec-SD', 'HM-Sec-Key', 'HM-Sec-Key-S', 'HM-Sec-Key-O', 'HM-Sen-Wa-Od', 'HM-Sen-MDIR', 'HM-Sen-MDIR-O', 'HM-Sen-MDIR-O-2', 'HM-WDS100-C6-O', 'HM-WDS100-C6-O-2', 'HM-WDS100-C6-O-2', 'HmIP-ASIR', 'HmIP-SWO-B'];
    var lr6x4 = ['HM-CCU-1', 'HM-ES-TX-WM', 'HM-WDC7000'];
    var lr3x1 = ['HM-RC-4-2', 'HM-RC-4-3', 'HM-RC-Key4-2', 'HM-RC-Key4-3', 'HM-RC-Sec4-2', 'HM-RC-Sec4-3', 'HM-Sec-RHS-2', 'HM-Sec-SCo', 'HmIP-KRC4', 'HmIP-KRCA', 'HmIP-RC8', 'HmIP-SRH', 'HmIP-SWDO', ' HmIP-DBB'];
    var lr3x2 = ['HM-TC-IT-WM-W-EU', 'HM-Dis-WM55', 'HM-Dis-EP-WM55', 'HM-PB-2-WM55', 'HM-PB-2-WM55-2', 'HM-PB-6-WM55', 'HM-PBI-2-FM', 'HM-RC-8', 'HM-Sen-DB-PCB', 'HM-Sen-EP', 'HM-Sen-MDIR-SM', 'HM-Sen-MDIR-WM55', 'HM-WDS30-T-O', 'HM-WDS30-OT2-SM', 'HmIP-STH', 'HmIP-STHD', 'HmIP-WRC2', 'HmIP-WRC6', 'HmIP-WTH', 'HmIP-WTH-2', 'HmIP-SAM', 'HmIP-SLO', 'HMIP-SWDO-I', 'HmIP-FCI6', ' HmIP-SMI55'];
    var lr3x3 = ['"HM-PB-4Dis-WM', 'HM-PB-4Dis-WM-2', 'HM-RC-Dis-H-x-EU', 'HM-Sen-LI-O'];
    var lr3x3a = ['"HM-RC-19', 'HM-RC-19-B', 'HM-RC-12', 'HM-RC-12-B', 'HM-RC-12-W'];
    var block9 = ['HM-LC-Sw1-Ba-PCB', 'HM-LC-Sw4-PCB', 'HM-MOD-EM-8', 'HM-MOD-Re-8', 'HM-Sen-RD-O', 'HM-OU-CM-PCB', 'HM-LC-Sw4-WM'];
    var fixed    = ['HM-Sec-SD-2', 'HmIP-SWSD'];
    var ohne = ['HM-LC-Sw1PBU-FM'];
    var recharge = ['HM-Sec-Win', 'HM-Sec-SFA-SM'];


    for (var i = 0; i < cr2016.length; i++) {
        if (cr2016[i] == native_type) {
            Batterie = '1x CR2016';
            break;
        }
    }
    for (i = 0; i < cr2032.length; i++) {
        if (cr2032[i] == native_type) {
            Batterie = '1x CR2032';
            break;
        }
    }
    for (i = 0; i < lr14x2.length; i++) {
        if (lr14x2[i] == native_type) {
            Batterie = '2x LR14';
            break;
        }
    }
    for (i = 0; i <lr44x2.length; i++) {
        if (lr44x2[i] == native_type) {
            Batterie = '2x LR44/AG13';
            break;
        }
    }
    for (i = 0; i <lr6x2.length; i++) {
        if (lr6x2[i] == native_type) {
            Batterie = '2x LR6/AA';
            break;
        }
    }
    for (i = 0; i < lr6x3.length; i++) {
        if (lr6x3[i] == native_type) {
            Batterie = '3x LR6/AA';
            break;
        }
    }
    for (i = 0; i < lr6x4.length; i++) {
        if (lr6x4[i] == native_type) {
            Batterie = '4x LR6/AA';
            break;
        }
    }
    for (i = 0; i < lr3x1.length; i++) {
        if (lr3x1[i] == native_type) {
            Batterie = '1x LR3/AAA';
            break;
        }
    }
    for (i = 0; i < lr3x2.length; i++) {
        if (lr3x2[i] == native_type) {
            Batterie = '2x LR3/AAA';
            break;
        }
    }
    for (i = 0; i < lr3x3.length; i++) {
        if (lr3x3[i] == native_type) {
            Batterie = '3x LR3/AAA';
            break;
        }
    }
    for (i = 0; i < lr3x3a.length; i++) {
        if (lr3x3a[i] == native_type) {
            Batterie = '3x AAA Akkus - bitte laden';
            break;
        }
    }
    for (i = 0; i < block9.length; i++) {
        if (block9[i] == native_type) {
            Batterie = '9Volt Block leer oder unbestimmt';
            break;
        }
    }
    for (i = 0; i < fixed.length; i++) {
        if (fixed[i] == native_type) {
            Batterie = 'Festbatterie leer';
            break;
        }
    }
    for (i = 0; i < ohne.length; i++) {
        if (ohne[i] == native_type) {
            Batterie = 'ohne Batterie';
            break;
        }
    }
    for (i = 0; i < recharge.length; i++) {
        if (recharge[i] == native_type) {
            Batterie = 'Akku entladen - bitte aufladen';
            break;
        }
    }

    return(Batterie);
   
}

function LOWBAT(obj) {
    var meldungsart = 'LOWBAT';
    var Gesamt = 0;
    var Betroffen = 0;
    var text      = [];
    var _message_tmp = ' ';
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
        var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
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
            _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">Spannung Batterien/Akkus gering.</font> '+Batterie+'\n';
           
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu +' ---' +Batterie);
        }
        //wenn Batterie unbekannt dann Log
        if(Batterie == 'unbekannt'){
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
        if(write_state){
            if(id_IST_LOWBAT){
                setState(id_IST_LOWBAT,Betroffen);
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
        if((debugging) || (onetime)){
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
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = ' ';
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
        var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
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
            _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">Spannung Batterien/Akkus gering.</font> '+Batterie+'\n';
           
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu +' ---' +Batterie);
        }
        //wenn Batterie unbekannt dann Log
        if(Batterie == 'unbekannt'){
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
    }
    else{
        if((debugging) || (onetime)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
    }
    
  
}

function UNREACH(obj) {
    var meldungsart = 'UNREACH';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = ' ';
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
        var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
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
            _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">Kommunikation gestört.</font> '+'\n';
           
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status ) ausgegeben
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
            _prio = prio_UNREACH;
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
    }
    else{
        if((debugging) || (onetime)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
    }
    
  
}

function STICKY_UNREACH(obj) {
    var meldungsart = 'STICKY_UNREACH';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = ' ';
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
        var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
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
                _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">Meldung über bestätigbare Kommunikationsstörung gelöscht.</font> '+'\n';
            }
            else {
                _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">bestätigbare Kommunikationsstörung.</font> '+'\n';    
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
            _prio = 0; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
    }
    else{
        if((debugging) || (onetime)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
    }
    
  
}

function CONFIG_PENDING(obj) {
    var meldungsart = 'CONFIG_PENDING';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = ' ';
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
        var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
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
            _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">Konfigurationsdaten stehen zur Übertragung an.</font> '+'\n';
           
         
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
            _prio = prio_UPDATE_PENDING; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
    }
    else{
        if((debugging) || (onetime)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
    }
    
  
}

function UPDATE_PENDING(obj) {
    var meldungsart = 'UPDATE_PENDING';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = ' ';
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
        var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
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
            _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">Update verfügbar.</font> '+'\n';
           
         
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
            _prio = prio_UPDATE_PENDING; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
    }
    else{
        if((debugging) || (onetime)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
    }
    
  
}

function DEVICE_IN_BOOTLOADER(obj) {
    var meldungsart = 'DEVICE_IN_BOOTLOADER';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = ' ';
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

    cacheSelectorDEVICE_IN_BOOTLOADER.each(function (id, i) {                         
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
        else {
            status_text = meldungsart +' mit dem Wert: ' +status;    
        }
        var obj    = getObject(id);
        var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
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
            _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">Gerät startet neu.</font> '+'\n';
           
         
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
            _prio = prio_DEVICE_IN_BOOTLOADER; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
    }
    else{
        if((debugging) || (onetime)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
    }
    
  
}

function ERROR(obj) {
    var meldungsart = 'ERROR';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = ' ';
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
        var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
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
            _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">'+status_text +'.</font> '+'\n';
           
         
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
            _prio = prio_ERROR; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
    }
    else{
        if((debugging) || (onetime)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
    }
    
  
}

function ERROR_CODE(obj) {
    var meldungsart = 'ERROR_CODE';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = ' ';
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
        var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
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
        status_text = meldungsart +' mit dem Wert: ' +status;    
        
        if (status > 0) {      // wenn Zustand größer 0, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                           // Zu Array hinzufügen
            _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">'+status_text +'.</font> '+'\n';
           
         
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
            _prio = prio_ERROR_CODE; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
    }
    else{
        if((debugging) || (onetime)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
    }
    
  
}

function FAULT_REPORTING(obj) {
    var meldungsart = 'FAULT_REPORTING';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = ' ';
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
        var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
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
            _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">' +status_text +'.</font> '+'\n';
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +datum_neu);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. Im Log wird der aktuelle Status (Anzahl, davon FAULT_REPORTING zutreffend) ausgegeben
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
            _prio = prio_FAULT_REPORTING; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
    }
    else{
        if((debugging) || (onetime)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
            }
        }
    }
    
  
}

function SABOTAGE(obj) {
    var meldungsart = 'SABOTAGE';
   var Gesamt = 0;
   var Betroffen = 0;
   var text      = [];
   var _message_tmp = ' ';
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

    cacheSelectorSABOTAGE.each(function (id, i) {                         
        var status = getState(id).val;                                  
        var status_text;
        var obj    = getObject(id);
        var common_name =  getObject(id).common.name.substr(0, obj.common.name.indexOf(':'));
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
        else {
            status_text = meldungsart +' mit dem Wert: ' +status;    
        }
        if (status === 1) {      
            ++Betroffen;
            text.push(common_name +' ('+id_name +')');                           // Zu Array hinzufügen
            _message_tmp = _message_tmp +common_name +' ('+id_name +')' + ' - <font color="red">' +status_text +'.</font> '+'\n';
           
         
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
            _prio = prio_SABOTAGE; 
            _titel = 'Servicemeldung';
            _message = _message_tmp;
            send_pushover_V4(_device, _message, _titel, _prio);
        }
    }
    else{
        if((debugging) || (onetime)){
            if(Gesamt === 0){
                log('Keine Geräte gefunden mit dem Datenpunkt ' +meldungsart +'.');
            }
            else{
                log('Es gibt: '+Gesamt +' Geräte mit dem Datenpunkt ' +meldungsart+'.');
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
    
    cacheSelectorERROR_CODE.on(function(obj) {    
        ERROR_CODE(obj);
    }); 
    
    cacheSelectorFAULT_REPORTING.on(function(obj) {    
        FAULT_REPORTING(obj);
    });
    cacheSelectorSABOTAGE.on(function(obj) {    
        SABOTAGE(obj);
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
    ERROR_CODE();
    FAULT_REPORTING();
    SABOTAGE();
}

