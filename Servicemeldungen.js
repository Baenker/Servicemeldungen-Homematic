/*******************************************************
* 29.03.19 V1.20    Komplett umgeschrieben 
*                   UNREACH, STICKY_UNREACH, SABOTAGE hinzugefügt
* 01.04.19 V1.21    Error hinzugefügt
* 02.04.19 V1.22    Übersetung Errormeldungen eingefügt
*                   Unterdrückung des Logeintrags wenn kein Datenpunkt zu einen bestimmten Servicetyp vorhanden ist. Wird nur beim manuellen Starten ausgegeben
* 04.04.19 V1.23    LOWBAT, LOW_BAT und ERROR_NON_FLAT_POSITIONING hinzugefügt
* 11.04.19 V1.24    Replace von ae zu ä usw hinzugefügt (erstmal nur wenn durch obj ausgeführt)
*                   Status_text in eigene Function ausgelaggert
*                   datum seit in eigene function ausgelaggert 
*                   FAULT_REPORTING und DEVICE_IN_BOOTLOADER hinzugefügt
*                   Alle globalen Variablen auf const und let geändert
*                   Alle Nebenfuntionen auf let und const geändert
*                   Update Batterieliste
*                   Fehler bei Sticky_Unreach beseitigt
* 17.04.19 V1.25    Timer der Push verzögert verändert. 
* 23.04.19 V1.26    Texte in Array eingebaut
*                   Timer verändert
* 28.04.19 V1.27    Timer verändert
* 11.05.19 V1.28    Timer verändert
* 13.05.19 V1.29    bestehender Timer wird abgebrochen und stattdessen neue Push verschickt
*                   Config_PENDING und UPDATE_PENDING aufgenommen
*                   Es wird die höchste Prio je nach Servicemeldung für Pushover gewählt.
* 14.05.19 V1.30    Parameter with_time wird wieder berücksichtigt
* 24.05.19 V1.31    Paramteer write_message wird wieder berücksichtigt
*                   Parameter write_state wird berücksichtigt für LOWBAT, LOW_BAT, UNREACH und STICKY_UNREACH die anderen folgen später
*                   Datenpunkte DEVICE_IN_BOOTLOADER wurde nicht überwacht nur ausgewertet
* 27.05.19 V1.32    Paramter write_state wird komplett berücksichtigt
*                   Erster Versuch doppelte Servicemelungen zu unterdrücken
*                   alte Variabe datum_neu übersehen
* 28.05.19 V1.33    Neuer Versuch doppelte zu unterdrücken (nur als log) etwas mehr logging
* 29.05.19 V1.34    Neuer Versuch doppelte zu unterdrücken
* 31.05.19 V1.35    Neuer Versuch
* 01.06.19 V1.36    doppelte Servicemeldungen werden unterdrückt. Logging reduziert
* 06.06.19 V1.37    Neuer Versuch. Mehr Logging
* 07.06.19 V1.38    und bzw oder Fehler entfernt.
* 09.06.19 V1.39    Zwei Abfragen seperat
* 10.06.19 V1.40    Abfrage vertauscht
* 15.06.19 V1.41    Einschränkung auf UNREACH und Sticky Unreach
* 18.06.19 V1.42    meldung_neu und meldung_alt werden nur unter bestimmten Umständen gefüllt
* 19.06.19 V1.43    Logging verändert. Evtl noch ein Problem bei der Unterdrückung doppelter Meldungen wenn schon ein Timer besteht
* 20.06.19 V1.44    Update Batterienliste
*                   Logging optimiert
* 22.06.19 V1.45    message_tmp und message_tmp1 entfernt (hatte ich beim ändern übersehen)
*                   Sticky_Unreach wird erst gezählt wenn Unreach erledigt ist (Danke an ArnoD)
* 01.07.19 V1.46    Update Batterieliste
*                   Bugfix Gesamtanzahl Servicemeldungen wurde nicht auf 0 gesetzt 
* 02.07.19 V1.47    Logging reduziert
*                   Bugfix Gesamtzahl Servicemeldungen kein Aufruf der Function mehr. Feld wird direkt geschrieben
* 04.07.19 V1.48    Bugfix Feld mit Servicemeldungen wird bei keiner Servicemeldung nicht gelöscht.
*                   Bugfix Feld mit Servicemeldungen wurde nicht immer zuverlässig oder verzögert aktualisiert
*                   Neuer Parameter "find_bug"
* 05.07.19 V1.49    Update Batterieliste
* 08.07.19 V1.50    Meldung das der Batterietyp für Cux-Geräte fehlt unterdrückt
*                   Log fehlerhafter Eintrag LOWBAT statt LOW_BAT
*                   Status von FAULT_REPORTING wurde nicht übersetzt
* 09.07.19 V1.51    Unterschiedlicher Loggingtext beim auftreten und aufheben einer Servicemeldung
*                   Wenn Sticky_UNreach und Unreach gleichzeitig auftreten wird eine Push verschickt
*                   find_bug geändert auf Zeitstempel von UNREACH Meldungen
* 11.07.19 V1.52    Update Batterieliste
* 19.07.19 V1.53    Logging für Zeitstempel Unreach geändert (find_bug)
*                   Bei V1.45 wurde nicht auf die Alarm Punkte abgefragt sondern auf UNREACH und STICKY_UNREACH
* 31.07.19 V1.54    Erstmal wieder find_bug auf false
* 21.08.19 V1.55    Vergleich von neuen und alten Servicemeldungen nun als Array damit bei mehr als 2 Meldungen die Meldung korrekt unterdrückt wird
* 23.08.19 V1.56    Änderungen im Umgang mit Unreach und Sticky_Unreach
* 06.09.19 V1.57    no_observation arbeitet nicht richtig. Korrekur erstmal nur für LOWBAT und LOW_BAT
* 07.09.19 V1.58    Vergleich no_oberservation bei der Verarbeitung aller Datenpunkte erntfernt da zukünftig überflüssig 
*                   Neuer Paramter show_each_device zeigt von jedem Gerät die überwachten Datenpunkte beim Scriptstart an
*                   no_observation auch für UNREACH
* 08.09.19 V1.59    Korrektur aller Servicemeldungen für no_observation
* 11.09.19 V1.60    Update Batterieliste
* 12.09.19 V1.61    Problem mit Cuxd Geräten behoben
* 12.11.19 V1.62    neue Option für Cuxd-Geräte
* 13.11.19 V1.63    Kleinere anpassungen
* 20.11.19 V1.64    Meldungen wurden immer mit Prio 0 verschickt
*                   Update Batterieliste
*                   doppelte Meldungen unterdrückt
* 23.11.19 V1.65    Bugfix Prio
* 02.12.19 V1.66    Unterdrückung bereits aufgetreter Meldungen
* 21.01.20 V1.67    Bei Stati abfragen von === auf ==
*                   Wenn Betroffen größer 0 kein Vergleich mehr auf Heating Gruppen (erstmal nur Testweise)
* 22.01.20 V1.68    Unterdrückund doppelter Push bei HMIP wenn Gerät in Heizungsgruppe für Sabotage
* 03.02.20 V1.69    Unterdrückund doppelter Push bei HMIP wenn Gerät in Heizungsgruppe für alle anderen Serviemeldungen
* 05.02.20 V1.70    Änderung für cuxd Geräte
* 17.02.20 V1.71    Update Batterieliste
*                   Überprüfung ob bestimmte Datenpunkte die überwacht werden sollen existieren
*                   Plausi-Prüfung CUXD
* 18.02.20 V1.72    Abfrage ob weitere Datenpunkte existieren
*                   Version wird bei Scriptstart angezeigt
* 18.05.20 V1.73    Versuch Fehler abzufangen falls common_name nicht existiert
* 04.11.20 V1.80    Anpassungen wegen JavaScript Adapter Update --> Läuft nur ab Version 4.90 vom Adapter
*                   Abfrgae mit existsState auf Konfigurationsfelder
*                   HmIP-eTRV-C hinzugefügt
* 24.11.20 V1.81    HmIP-DSD-PCB hinzugefügt
* 31.01.21 V1.82    HmIP-WGC hinzugefügt
                    Feld Servicemeldung Gesamt wurde nicht richtig gesetzt
* 05.03.21 V1.83    Anpassungen Fault_Reporting
* 14.03.21 V1.84    HmIP-SWO-PR hinzugefügt  
* 14.05.21 V1.85    Fehler Error Zweig
* 07.06.21 V1.86    Logging bei Push
*                   Fehler im Error Zweig
* 07.08.21 V1.87    Wenn Error _= 7 dann Sabotage
* 09.08.21 V1.88    Umstellung userdata
* 08.10.21 V1.89    verschiedene neue Geräte hinzugefügt
* 12.10.21 V1.90    Neuer Paramter sendpush_LOWBAT wenn sendpush = false und sendpush_LOWBAT true wird eine Pushover verschickt wenn Batterie leer sonst nicht 
* 20.10.21 V1.91    Felder mit existObject abfragen
* 08.11.21 V1.92    HmIP-WRCD Batterie aufgenommen
* 28.11.21 V1.93    HmIP-eTRV-E  aufgenommen
* 21.02.22 V1.94    weitere geräte aufgenommen

* Andere theoretisch mögliche LOWBAT_REPORTING, U_SOURCE_FAIL, USBH_POWERFAIL, STICKY_SABOTAGE, ERROR_REDUCED, ERROR_SABOTAGE
*******************************************************/ 
const Version = 1.94;
const logging = true;             //Sollte immer auf true stehen. Bei false wird garnicht protokolliert
const debugging = false;          //true protokolliert viele zusätzliche Infos
const find_bug = false;         //erhöht das Logging wird nur verwendet wenn ein aktulles Bug gesucht wird
const show_each_device = false; //zeigt alle verfügbaren Datenpunkte je Device

const autoAck = true;             //Löschen bestätigbarer Kommunikationsstörungen (true = an, false = aus)

const observation = true;        //Dauerhafte Überwachung der Geräte auf Servicemeldungen aktiv (true = aktiv // false =inaktiv)
const onetime = true;             //Prüft beim Script Start ob derzeit Geräte eine Servicemeldung haben
const with_time = false;           //Hängt die Uhrzeit an die Serviemeldung

//Geräte die nicht überwacht werden sollen. Komma getrennt erfassen
const no_observation = 'LEQ092862x9, XXX';

//Instanz Cuxd ausschließen. Instanz als Zahl z. B. '1' oder bei Nichtnutzung hohe Nr eintragen z. B. '9'
const CUXD = '9';

//pro Fehlertyp kann eine andere Prio genutzt werden
const prio_LOWBAT = 0;
const prio_UNREACH = 0;
const prio_STICKY_UNREACH = 0;
const prio_CONFIG_PENDING = 0;
const prio_UPDATE_PENDING = 0;
const prio_DEVICE_IN_BOOTLOADER = 0;
const prio_ERROR = 0;
const prio_ERROR_CODE = 0;
const prio_FAULT_REPORTING = 0;
const prio_SABOTAGE= 0;
const prio_ERROR_NON_FLAT_POSITIONING = 0;

//Variablen für Servicemeldung in Objekt schreiben // Wenn einer Meldung auftritt wird diese in ein Textfeld geschrieben. z. B. für vis
const write_message = false;        // true schreibt beim auftreten einer Servicemeldung die Serviemeldung in ein Objekt
const id_Text_Servicemeldung = '';  // Objekt wo die Servicemeldung hingeschrieben werden soll (String)

//Variablen für Pushover
const sendpush = false;     //true = verschickt per Pushover Nachrchten // false = Pushover wird nicht benutzt
const sendpush_LOWBAT = true;     //true = verschickt per Pushover Nachrchten bei Low_BAT// false = Pushover wird nicht benutzt
const pushover_Instanz0 =  'pushover.0';     // Pushover instance für Pio = 0
const pushover_Instanz1 =  'pushover.1';     // Pushover instance für Pio = 1
const pushover_Instanz2 =  'pushover.2';     // Pushover instance für Pio = 2
const pushover_Instanz3 =  'pushover.3';     // Pushover instance für Pio = -1 oder -2
let h_prio = -2;              //nicht verändern die höchste Prio nach Fehlertyp wird verwendet

let titel;
let message;
let device = 'TPhone';         //Welches Gerät soll die Nachricht bekommen
//let _device = 'All'; 

//Variablen für Telegram
const sendtelegram = false;            //true = verschickt per Telegram Nachrchten // false = Telegram wird nicht benutzt
const user_telegram = '';             //User der die Nachricht bekommen soll

//Variable zum verschicken der Servicemeldungen per eMail
const sendmail = false;            //true = verschickt per email Nachrchten // false = email wird nicht benutzt

//Ergebnis in Datenfelder schreiben
const write_state = true;          //Schreibt die Ergebnisse der Servicemeldungen in Datenfelder. (true = schreiben, false, kein schreiben)
//nicht benutzte Felder einfach leer lassen --> var id_IST_XXX = '';
//Müssen selber als Zahl angelegt werden
const id_IST_LOWBAT = '0_userdata.0.Haus.Servicemeldungen.Anzahl_LowBat'/*Anzahl LowBat*/;
const id_IST_LOW_BAT = '';
const id_IST_UNREACH = '0_userdata.0.Haus.Servicemeldungen.Anzahl_Unreach'/*Anzahl Unreach*/;
const id_IST_STICKY_UNREACH = '0_userdata.0.Haus.Servicemeldungen.Anzahl_Sticky_Unreach'/*Anzahl Sticky Unreach*/;
const id_IST_CONFIG_PENDING = '';
const id_IST_UPDATE_PENDING = '';
const id_IST_DEVICE_IN_BOOTLOADER = '';
const id_IST_ERROR = '';
const id_IST_ERROR_NON_FLAT_POSITIONING = '';
const id_IST_ERROR_CODE = '';
const id_IST_FAULT_REPORTING = '';
const id_IST_SABOTAGE = '';
const id_IST_Gesamt = '0_userdata.0.Haus.Servicemeldungen.Anzahl_Gesamt'/*Anzahl Gesamt*/;

//Ab hier eigentliches Script
const SelectorLOWBAT  = $('channel[state.id=hm-rpc.*.0.LOWBAT_ALARM]');
const SelectorLOW_BAT  = $('channel[state.id=hm-rpc.*.0.LOW_BAT_ALARM]');
const SelectorUNREACH  = $('channel[state.id=hm-rpc.*.0.UNREACH_ALARM]');
const SelectorSTICKY_UNREACH  = $('channel[state.id=hm-rpc.*.0.STICKY_UNREACH_ALARM]');
const SelectorCONFIG_PENDING  = $('channel[state.id=hm-rpc.*.0.CONFIG_PENDING_ALARM]');
const SelectorUPDATE_PENDING  = $('channel[state.id=hm-rpc.*.0.UPDATE_PENDING_ALARM]');
const SelectorDEVICE_IN_BOOTLOADER  = $('channel[state.id=hm-rpc.*.0.DEVICE_IN_BOOTLOADER_ALARM]');
const SelectorERROR  = $('channel[state.id=hm-rpc.*.1.ERROR]');
const SelectorERROR_CODE  = $('channel[state.id=hm-rpc.*.ERROR_CODE]');
const SelectorFAULT_REPORTING  = $('channel[state.id=hm-rpc.*.4.FAULT_REPORTING]');
const SelectorSABOTAGE  = $('channel[state.id=hm-rpc.*.0.SABOTAGE_ALARM]');
const SelectorERROR_NON_FLAT_POSITIONING = $('channel[state.id=hm-rpc.*.0.ERROR_NON_FLAT_POSITIONING_ALARM]');

let timer = null;
let timer_sticky_unreach = null;
let meldung_alt = [];
let meldung_neu = [];

function send_pushover (device, message, titel, prio) {
    //Version V4.01 vom 10.04.19
    let pushover_Instanz;
    if (prio === 0){pushover_Instanz =  pushover_Instanz0;}
    else if (prio == 1){pushover_Instanz =  pushover_Instanz1;}
    else if (prio == 2){pushover_Instanz =  pushover_Instanz2;}
    else {pushover_Instanz =  pushover_Instanz3;}
    sendTo(pushover_Instanz, { 
        device: device,
        message: message, 
        title: titel, 
        priority: prio,
        retry: 60,
        expire: 600,
        html: 1
    }); 
}

function send_telegram (message, user_telegram) {
    sendTo('telegram.0', { 
        text: message,
        user: user_telegram,
        parse_mode: 'HTML'
    }); 

}

function send_mail (message) {
    sendTo("email", {
        //from:    "iobroker@mydomain.com",
        //to:      "aabbcc@gmail.com",
        subject: "Servicemeldung",
        text:    message
    });


}

function replaceAll(string, token, newtoken) {      
    if(token!=newtoken)
    while(string.indexOf(token) > -1) {
        string = string.replace(token, newtoken);
    }
    return string;
}

function func_translate_status(meldungsart, native_type, status){
    let status_text;
    if(meldungsart == 'UNREACH_ALARM' || meldungsart == 'STICKY_UNREACH_ALARM'){
        if(status == 0){
            status_text = 'keine Kommunikationsfehler';
        }
        else if (status == 1){
            status_text = 'Kommunikation gestört';    
        }
        else if (status == 2){
            status_text = 'Kommunikation war gestört';    
        }
    }
    else if(meldungsart == 'SABOTAGE_ALARM'){
        if(status == 0){
            status_text = 'Keine Sabotage';
        }
        else if(status == 1){
            status_text = 'Sabotage';
        }
        else if(status == 2){
            status_text = 'Sabotage aufgehoben';
        }
    }
    else if(meldungsart == 'ERROR'){
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
    }
    else if(meldungsart == 'LOWBAT_ALARM' || meldungsart == 'LOW_BAT_ALARM'){
        if(status === 0){
            status_text = 'Batterie ok';
        }
        else if (status == 1){
            status_text = 'Batterie niedrig';    
        }
        else if (status == 2){
            status_text = 'Batterie ok';    
        }
    
    }
    else if(meldungsart == 'ERROR_NON_FLAT_POSITIONING_ALARM'){
        if(status === 0){
            status_text = 'Keine Meldung';
        }
        else if(status == 1){
            status_text = 'Gerät wurde angehoben.';
        }
        else if(status == 2){
            status_text = 'Gerät wurde angehoben. Bestätigt';
        }
        
    }
    else if(meldungsart == 'CONFIG_PENDING_ALARM'){
        if(status === 0){
            status_text = 'keine Meldung';
        }
        else if (status == 1){
            status_text = 'Konfigurationsdaten stehen zur Übertragung an';    
        }
        else if (status == 2){
            status_text = 'Konfigurationsdaten standen zur Übertragung an';    
        }
        
    }
    else if(meldungsart == 'UPDATE_PENDING_ALARM'){
        if(status === 0){
            status_text = 'kein Update verfügbar';
        }
        else if (status == 1){
            status_text = 'Update verfügbar';    
        }
        else if (status == 2){
            status_text = 'Update wurde eingespielt';    
        }    
        
    }
    else if(meldungsart == 'DEVICE_IN_BOOTLOADER_ALARM'){
        if(status === 0){
            status_text = 'Keine Meldung';
        }
        else if(status == 1){
            status_text = 'Gerät startet neu';
        }
        else if(status == 2){
            status_text = 'Gerät wurde neu getsartet';
        }    
    }
    else if(meldungsart == 'FAULT_REPORTING'){
        if(native_type == 'HM-CC-RT-DN'){
            if(status == 0){
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
            
    }
    else{
    if(status == 0){
                status_text = 'keine Störung';
            }
            else if(status == 1){
                status_text = 'Störung';    
            }
            else if(status == 2){
                status_text = 'bestätigte Störung';    
            }    
    }  
    return(status_text);
}

function func_get_datum(id){
    let datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
    let datum_seit;
    if(datum < '01.01.71 01:00:00'){
        datum_seit = '';
        
    }else{
        datum_seit=  ' --- seit: ' +datum +' Uhr';
    }
    return(datum_seit);
}

function func_Batterie(native_type){
    let Batterie = 'unbekannt';
    let cr2016 = ['HM-RC-4', 'HM-RC-4-B', 'HM-RC-Key3', 'HM-RC-Key3-B', 'HM-RC-P1', 'HM-RC-Sec3', 'HM-RC-Sec3-B', 'ZEL STG RM HS 4'];
    let cr2032 = ['HM-PB-2-WM', 'HM-PB-4-WM', 'HM-PBI-4-FM', 'HM-SCI-3-FM', 'HM-Sec-TiS', 'HM-SwI-3-FM', 'HmIP-FCI1'];
    let lr14x2 = ['HM-Sec-Sir-WM', 'HM-OU-CFM-TW', 'HM-OU-CFM-Pl', 'HM-OU-CF-Pl'];
    let lr44x2 = ['HM-Sec-SC', 'HM-Sec-SC2L', 'HM-Sec-SC-2', 'HM-Sec-RHS'];
    let lr6x2 = ['HM-CC-VD', 'HM-CC-RT-DN', 'HM-Sec-WDS', 'HM-Sec-WDS-2', 'HM-CC-TC', 'HM-Dis-TD-T', 'HB-UW-Sen-THPL-I', 'HM-WDS40-TH-I', 'HM-WDS40-TH-I-2', 'HM-WDS10-TH-O', 'HmIP-SMI', 'HMIP-eTRV', 'HM-WDS30-OT2-SM-2', 'HmIP-SMO', 'HmIP-SMO-A', 'HmIP-SPI', 'HmIP-eTRV-2', 'HmIP-SPDR', 'HmIP-SWD', 'HmIP-STHO-A', 'HmIP-eTRV-B', 'HmIP-PCBS-BAT','HmIP-STHO', 'HmIP-eTRV-C', 'HmIP-WGC', 'HmIP-eTRV-C-2', 'HmIP-eTRV-E ', 'HmIP-STE2-PCB', 'HmIP-WRCR', 'HmIP-WTH-B', 'HmIP-eTRV-E-S'];
    let lr6x3 = ['HmIP-SWO-PL', 'HM-Sec-MDIR', 'HM-Sec-MDIR-2', 'HM-Sec-SD', 'HM-Sec-Key', 'HM-Sec-Key-S', 'HM-Sec-Key-O', 'HM-Sen-Wa-Od', 'HM-Sen-MDIR', 'HM-Sen-MDIR-O', 'HM-Sen-MDIR-O-2', 'HM-WDS100-C6-O', 'HM-WDS100-C6-O-2', 'HM-WDS100-C6-O-2', 'HmIP-ASIR', 'HmIP-SWO-B', 'HM-Sen-MDIR-O-3', 'HM-Sec-MDIR-3', 'HmIP-SWO-PR', 'HmIP-DLD'];
    let lr6x4 = ['HM-CCU-1', 'HM-ES-TX-WM', 'HM-WDC7000'];
    let lr3x1 = ['HM-RC-4-2', 'HM-RC-4-3', 'HM-RC-Key4-2', 'HM-RC-Key4-3', 'HM-RC-Sec4-2', 'HM-RC-Sec4-3', 'HM-Sec-RHS-2', 'HM-Sec-SCo', 'HmIP-KRC4', 'HmIP-KRCA', 'HmIP-SRH', 'HMIP-SWDO', 'HmIP-DBB', 'HmIP-RCB1', 'HmIP-KRCK'];
    let lr3x2 = ['HM-TC-IT-WM-W-EU', 'HM-Dis-WM55', 'HM-Dis-EP-WM55', 'HM-PB-2-WM55', 'HM-PB-2-WM55-2', 'HM-PB-6-WM55', 'HM-PBI-2-FM', 'HM-RC-8', 'HM-Sen-DB-PCB', 'HM-Sen-EP', 'HM-Sen-MDIR-SM', 'HM-Sen-MDIR-WM55', 'HM-WDS30-T-O', 'HM-WDS30-OT2-SM', 'HmIP-STH', 'HmIP-STHD', 'HmIP-WRC2', 'HmIP-WRC6', 'HmIP-WTH', 'HmIP-WTH-2', 'HmIP-SAM', 'HmIP-SLO', 'HMIP-SWDO-I', 'HmIP-FCI6', 'HmIP-SMI55', 'HM-PB-2-FM', 'HmIP-SWDM', 'HmIP-SCI', 'HmIP-SWDM-B2', 'HmIP-RC8', 'ALPHA-IP-RBG', 'HmIP-DSD-PCB', 'HmIP-WRCD'];
    let lr3x3 = ['HM-PB-4Dis-WM', 'HM-PB-4Dis-WM-2', 'HM-RC-Dis-H-x-EU', 'HM-Sen-LI-O'];
    let lr3x3a = ['HM-RC-19', 'HM-RC-19-B', 'HM-RC-12', 'HM-RC-12-B', 'HM-RC-12-W'];
    let lr14x3 = ['HmIP-MP3P'];
    let block9 = ['HM-LC-Sw1-Ba-PCB', 'HM-LC-Sw4-PCB', 'HM-MOD-EM-8', 'HM-MOD-Re-8', 'HM-Sen-RD-O', 'HM-OU-CM-PCB', 'HM-LC-Sw4-WM'];
    let fixed    = ['HM-Sec-SD-2', 'HmIP-SWSD'];
    let ohne = ['HM-LC-Sw1PBU-FM', 'HM-LC-Sw1-Pl-DN-R1', 'HM-LC-Sw1-DR', 'HM-LC-RGBW-WM', 'HM-LC-Sw1-Pl-CT-R1', 'HmIP-HEATING', 'HM-LC-Sw1-FM', 'HM-LC-Sw2-FM', 'HM-LC-Sw4-DR', 'HM-LC-Sw1-Pl', 'HM-LC-Sw1-Pl-2', 'HM-LC-Sw4-Ba-PCB', 'HM-LC-Sw1-SM', 'HM-LC-Sw4-SM', 'HM-Sys-sRP-Pl', 'HM-LC-Sw2PBU-FM', 'HM-LC-Sw1-PCB', 'HM-LC-Sw4-DR-2'];
    let recharge = ['HM-Sec-Win', 'HM-Sec-SFA-SM',  'HM-RC-19-SW'];


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
    //wird nicht mehr verwendet
    
    log('Fehler function func_IST_Gesamt wurde aufgerufen.');
    let IST_LOWBAT = 0;
    let IST_LOW_BAT = 0;
    let IST_UNREACH = 0;
    let IST_STICKY_UNREACH = 0;
    let IST_CONFIG_PENDING = 0;
    let IST_UPDATE_PENDING = 0;
    let IST_DEVICE_IN_BOOTLOADER = 0;
    let IST_ERROR = 0;
    let IST_ERROR_NON_FLAT_POSITIONING = 0;
    let IST_ERROR_CODE = 0;
    let IST_FAULT_REPORTING = 0;
    let IST_SABOTAGE = 2;
    let IST_Gesamt = 0;


    if(write_state){ 
        if(existsState(id_IST_LOWBAT)){
             IST_LOWBAT = parseFloat(getState(id_IST_LOWBAT).val);    
        }
        if(existsState(id_IST_LOW_BAT)){
            IST_LOW_BAT = parseFloat(getState(id_IST_LOW_BAT).val);
        }
        if(existsState(id_IST_UNREACH)){
            IST_UNREACH = parseFloat(getState(id_IST_UNREACH).val);
        }
        if(existsState(id_IST_STICKY_UNREACH)){
            IST_STICKY_UNREACH = parseFloat(getState(id_IST_STICKY_UNREACH).val);
        }
        if(existsState(id_IST_CONFIG_PENDING)){
            IST_CONFIG_PENDING = parseFloat(getState(id_IST_CONFIG_PENDING).val);
        }
        if(existsState(id_IST_UPDATE_PENDING)){
            IST_UPDATE_PENDING = parseFloat(getState(id_IST_UPDATE_PENDING).val);
        }
        if(existsState(id_IST_UPDATE_PENDING)){
            IST_UPDATE_PENDING = parseFloat(getState(id_IST_UPDATE_PENDING).val);
        }
        if(existsState(id_IST_DEVICE_IN_BOOTLOADER)){
            IST_DEVICE_IN_BOOTLOADER = parseFloat(getState(id_IST_DEVICE_IN_BOOTLOADER).val);
        }
        if(existsState(id_IST_ERROR)){
            IST_ERROR = parseFloat(getState(id_IST_ERROR).val);
        }
        if(existsState(id_IST_ERROR_CODE)){
             IST_ERROR_CODE = parseFloat(getState(id_IST_ERROR_CODE).val);
        }
        if(existsState(id_IST_FAULT_REPORTING)){
            IST_FAULT_REPORTING = parseFloat(getState(id_IST_FAULT_REPORTING).val);
        }
        if(existsState(id_IST_SABOTAGE)){
            IST_SABOTAGE = parseFloat(getState(id_IST_SABOTAGE).val);
        }
        
    
        if(!existsState(id_IST_Gesamt)){
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

function Servicemeldung(obj) {
    var prio = h_prio
    var common_name;
    var obj;
    var id_name;
    var native_type; 
    var meldungsart;
    var Gesamt = 0;
    var Gesamt_UNREACH = 0;
    var Gesamt_STICKY_UNREACH = 0;
    var Gesamt_SABOTAGE = 0;
    var Gesamt_ERROR = 0;
    var Gesamt_LOWBAT = 0;
    var Gesamt_LOW_BAT = 0;
    var Gesamt_ERROR_NON_FLAT_POSITIONING = 0;
    var Gesamt_CONFIG_PENDING = 0;
    var Gesamt_UPDATE_PENDING = 0;
    var Gesamt_DEVICE_IN_BOOTLOADER = 0;
    var Gesamt_FAULT_REPORTING = 0;
    var Betroffen = 0;
    var Betroffen_no_observation = 0;
    var Betroffen_UNREACH = 0;
    var Betroffen_STICKY_UNREACH = 0;
    var Betroffen_SABOTAGE = 0;
    var Betroffen_ERROR = 0;
    var Betroffen_LOWBAT = 0;
    var Betroffen_LOW_BAT = 0;
    var Betroffen_ERROR_NON_FLAT_POSITIONING = 0;
    var Betroffen_CONFIG_PENDING = 0;
    var Betroffen_UPDATE_PENDING = 0;
    var Betroffen_DEVICE_IN_BOOTLOADER = 0;
    var Betroffen_FAULT_REPORTING = 0;
    var Betroffen_UNREACH_no_observation = 0;
    var Betroffen_STICKY_UNREACH_no_observation = 0;
    var Betroffen_SABOTAGE_no_observation = 0;
    var Betroffen_ERROR_no_observation = 0;
    var Betroffen_LOWBAT_no_observation = 0;
    var Betroffen_LOW_BAT_no_observation = 0;
    var Betroffen_ERROR_NON_FLAT_POSITIONING_no_observation = 0;
    var Betroffen_CONFIG_PENDING_no_observation = 0;
    var Betroffen_UPDATE_PENDING_no_observation = 0;
    var Betroffen_DEVICE_IN_BOOTLOADER_no_observation = 0;
    var Betroffen_FAULT_REPORTING_no_observation = 0;
    var id_UNREACH;
    var sendpush_LOWBAT_neu = false;
    var servicemeldung = [];
    var formatiert_servicemeldung = [];
    var log_manuell = false;
    
    if (obj) {
        common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        id_name = obj.id.split('.')[2];
        native_type = getObject(obj.id.substring(0, obj.id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = obj.id.split('.')[4];
        var status = obj.newState.val;                                 
        var status_text = func_translate_status(meldungsart, native_type, status);
        
        common_name = replaceAll(common_name, '.', ' ');          // Umwandeln aller "." in Leerzeichen
        common_name = replaceAll(common_name, 'ae', 'ä');         // Sonderzeichen umwandeln für bessere Text- und Sprachausgabe
        common_name = replaceAll(common_name, 'ue', 'ü');
        common_name = replaceAll(common_name, 'oe', 'ö');
        common_name = replaceAll(common_name, 'ss', 'ß');
    
        if(no_observation.search(id_name) == -1){
            if(meldungsart != 'ERROR' && meldungsart != 'FAULT_REPORTING' && status != 1){
                log('Servicemeldung aufgehoben: ' +common_name +' ('+id_name +') --- ' +native_type +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);    
            }
            else{
                log('Neue Servicemeldung: ' +common_name +' ('+id_name +') --- ' +native_type +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
            }
        }
        else{
            if(debugging){
                log('[DEBUG] ' +'Neue Servicemeldung außerhalb der Überwachung: ' +common_name +' ('+id_name +') --- ' +native_type +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);    
            }
        }
           
        
    } 
    else {
        if(logging){
            log('Script manuell gestartet. (Version: '+Version +')');  
        }
        log_manuell = true;
    }
    
    
    SelectorLOWBAT.each(function (id, i) {                         // Schleife für jedes gefundenen Element *.LOWBAT
        if(existsObject(id)){
            if(CUXD != id.split('.')[1]){
                if(id.search('CUX') == -1){
                    if(getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name){
                        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
                    }
                    else{
                        log('[Script wird gestoppt] Der Common_name-Datenpunkt ' +id +' existiert nicht.', 'warn');
                        return false;
                    }
                    id_name = id.split('.')[2];
                    obj    = getObject(id);
                    native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
                    meldungsart = id.split('.')[4];
                    var status = getState(id).val;                                  
                    var status_text = func_translate_status(meldungsart, native_type, status);
                    var Batterie = func_Batterie(native_type);    
                    var datum_seit = func_get_datum(id);
                    
                    if (status === 1 && no_observation.search(id_name) != -1) {
                        ++Betroffen_no_observation
                        ++Betroffen_LOWBAT_no_observation
                    }
                    if (status === 1 && no_observation.search(id_name) == -1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
                        ++Betroffen;
                        ++Betroffen_LOWBAT
                        if(prio < prio_LOWBAT){prio = prio_LOWBAT;}
                        if(with_time && datum_seit !== ''){
                            formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Spannung Batterien/Akkus gering.</font> '+Batterie +datum_seit);
                            servicemeldung.push(common_name +' ('+id_name +')' + ' - Spannung Batterien/Akkus gering. '+Batterie);
                        }
                        else{
                            formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Spannung Batterien/Akkus gering.</font> '+Batterie +datum_seit);
                            servicemeldung.push(common_name +' ('+id_name +')' + ' - Spannung Batterien/Akkus gering. '+Batterie);    
                        }
                        
                    
                    }  
                    ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
                    ++Gesamt_LOWBAT
                    if(show_each_device && log_manuell){
                        log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +' --- ' +Batterie);
                    }
                    //wenn Batterie unbekannt dann Log
                    if(Batterie == 'unbekannt' && native_type !=='' && id_name.substring(0, 3) != 'CUX'){
                        log('Bitte melden: ' + common_name +' ('+id_name+') --- '+native_type +' --- Batterietyp fehlt im Script');
                    }
                }
                else{
                    log('[Script wird gestoppt] LOWBAT: Die Cuxd-Instanz wurde im Script auf ' +CUXD +' gestellt. Ein Objekt hat folgenden Namen: ' +id ,'warn');
                    return false;
                }
            }
        }
        else{
            log('[Script wird gestoppt] Der Datenpunkt ' +id +' existiert nicht.', 'warn');
            return false;   
        }
        
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_LOWBAT === 0){
        if(log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt LOWBAT.');
        }
    }
    else{
        if(Betroffen_LOWBAT_no_observation > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_LOWBAT +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_LOWBAT_no_observation +' unterdrückte Servicemeldung(en).');    
            }
        }
    
        if(Betroffen_LOWBAT > 0){
            if(sendpush_LOWBAT){
                sendpush_LOWBAT_neu = true;
            }
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_LOWBAT +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_LOWBAT +' Servicemeldung(en).');    
            }
            if(write_state){
                if(existsObject(id_IST_LOWBAT)){
                    setState(id_IST_LOWBAT,Betroffen_LOWBAT);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für LOWBAT nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
        else{
            if((log_manuell) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_LOWBAT +' Geräte mit dem Datenpunkt LOWBAT.');
            
            }
            if(write_state){
                if(existsObject(id_IST_LOWBAT)){
                    setState(id_IST_LOWBAT,0);
                   
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für LOWBAT nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
    }
    
    SelectorLOW_BAT.each(function (id, i) {                         // Schleife für jedes gefundenen Element 
        if(existsObject(id)){
            if(getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name){
                common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
            }
            else{
                log('[Script wird gestoppt] Der Common_name-Datenpunkt ' +id +' existiert nicht.', 'warn');
                return false;
            }
        
            id_name = id.split('.')[2];
            obj = getObject(id);
            native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
            meldungsart = id.split('.')[4];
            var status = getState(id).val;                                  
            var status_text = func_translate_status(meldungsart, native_type, status);
            var Batterie = func_Batterie(native_type);
            //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
            var datum_seit = func_get_datum(id);
            
            if (status === 1 && no_observation.search(id_name) != -1) {
                ++Betroffen_no_observation
                ++Betroffen_LOW_BAT_no_observation
            }
            if(status == 1 && native_type =='HmIP-HEATING'){
                if(debugging){
                    log(common_name +' ('+id_name +') hat eine Servicemeldung gemeldet. Da es eine Heizungsgruppe ist erfolgt keine Push');
                }
            }

            if (status == 1 && no_observation.search(id_name) == -1 && native_type !='HmIP-HEATING') {      
                ++Betroffen;
                ++Betroffen_LOW_BAT
                if(prio < prio_LOWBAT){prio = prio_LOWBAT;}
                if(with_time && datum_seit !== ''){
                    formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Spannung Batterien/Akkus gering.</font> '+Batterie +datum_seit);
                    servicemeldung.push(common_name +' ('+id_name +')' + ' - Spannung Batterien/Akkus gering. '+Batterie +datum_seit);
                }
                else{
                    formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Spannung Batterien/Akkus gering.</font> '+Batterie);
                    servicemeldung.push(common_name +' ('+id_name +')' + ' - Spannung Batterien/Akkus gering. '+Batterie);    
                }
                
            
            }  
            ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
            ++Gesamt_LOW_BAT
            if(show_each_device && log_manuell){
                log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +' --- ' +Batterie);
            }
            //wenn Batterie unbekannt dann Log
            if(Batterie == 'unbekannt' && native_type !==''){
                log('Bitte melden: ' + common_name +' ('+id_name+') --- '+native_type +' --- Batterietyp fehlt im Script');
            }

        }
        else{
            log('[Script wird gestoppt] Der Datenpunkt ' +id +' existiert nicht.', 'warn');
            return false;   
        }
        
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_LOW_BAT === 0){
        if(log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt LOW_BAT.');
        }
    }
    else{
        if(Betroffen_LOW_BAT_no_observation > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_LOW_BAT +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_LOW_BAT_no_observation +' unterdrückte Servicemeldung(en).');    
            }
        }
        if(Betroffen_LOW_BAT > 0){
            if(sendpush_LOWBAT){
                sendpush_LOWBAT_neu = true;
            }
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_LOW_BAT +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_LOW_BAT +' Servicemeldung(en).');    
            }
            if(write_state){
                if(existsObject(id_IST_LOW_BAT)){
                    setState(id_IST_LOW_BAT,Betroffen_LOW_BAT);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für LOW_BAT nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
        else{
            if((log_manuell) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_LOW_BAT +' Geräte mit dem Datenpunkt LOW_BAT.');
            
            }
            if(write_state){
                if(existsObject(id_IST_LOW_BAT)){
                    setState(id_IST_LOW_BAT,0);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für LOW_BAT nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
    }
    
    SelectorUNREACH.each(function (id, i) {                         // Schleife für jedes gefundenen Element
        if(existsObject(id)){    
            if(CUXD != id.split('.')[1]){
                if(id.search('CUX') == -1){
                    common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
                    id_name = id.split('.')[2];
                    obj = getObject(id);
                    native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
                    meldungsart = id.split('.')[4];
                    var id_STICKY_UNREACH = id.substring(0, id.lastIndexOf('.')+1) +'STICKY_UNREACH_ALARM';
                    if(native_type.substring(0, 3) == 'HM-' && id_name.substring(0, 3) != 'CUX'){
                        var statusSTICKY_UNREACH = getState(id_STICKY_UNREACH).val;
                        
                    }
                    var status = getState(id).val;                                  
                    var status_text = func_translate_status(meldungsart, native_type, status);
                    var datum_seit = func_get_datum(id);
                    
                    if (status === 1 && no_observation.search(id_name) != -1) {
                        ++Betroffen_no_observation
                        ++Betroffen_UNREACH_no_observation
                    }
                    if(status == 1 && native_type =='HmIP-HEATING'){
                        if(debugging){
                            log(common_name +' ('+id_name +') hat eine Servicemeldung gemeldet. Da es eine Heizungsgruppe ist erfolgt keine Push');
                        }
                    }

                    if (status == 1 && no_observation.search(id_name) == -1 && native_type !='HmIP-HEATING') {   
                        ++Betroffen;
                        ++Betroffen_UNREACH;
                        if(prio < prio_UNREACH){prio = prio_UNREACH;}
                        
                        if(with_time && datum_seit !== ''){
                            formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Kommunikation gestört.</font>' +datum_seit);
                            servicemeldung.push(common_name +' ('+id_name +')' + ' - Kommunikation gestört.' +datum_seit);    
                        }
                        else{
                            formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Kommunikation gestört.</font>');
                            servicemeldung.push(common_name +' ('+id_name +')' + ' - Kommunikation gestört.');
                        }
                        
                    
                    }  
                    ++Gesamt;       // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
                    ++Gesamt_UNREACH;
                    
                    if(show_each_device && log_manuell){
                        log('Geräte Nr. ' +(i + 1)  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
                    }
                }
                else{
                    log('[Script wird gestoppt] UNREACH: Die Cuxd-Instanz wurde im Script auf ' +CUXD +' gestellt. Ein Objekt hat folgenden Namen: ' +id ,'warn');
                    return false;
                }
            }
        }
        else{
            log('[Script wird gestoppt] Der Datenpunkt ' +id +' existiert nicht.', 'warn');
            return false;   
        }                                             
    });
    
    // Schleife ist durchlaufen. 
    if(Gesamt_UNREACH === 0){
        if(log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt UNREACH.');
        }
    }
    else{
        if(Betroffen_UNREACH_no_observation > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_UNREACH +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_UNREACH_no_observation +' unterdrückte Servicemeldung(en).');    
            }
        }
        if(Betroffen_UNREACH > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_UNREACH +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_UNREACH +' Servicemeldung(en).');    
            }
            if(write_state){
                if(existsObject(id_IST_UNREACH)){
                    setState(id_IST_UNREACH,Betroffen_UNREACH);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für UNREACH nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
        else{
            if((log_manuell) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_UNREACH +' Geräte mit dem Datenpunkt UNREACH.');
            
            }
            if(write_state){
                if(existsObject(id_IST_UNREACH)){
                    setState(id_IST_UNREACH,0);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für UNREACH nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
    }
    
    SelectorSTICKY_UNREACH.each(function (id, i) {
        if(existsObject(id)){  
            if(CUXD != id.split('.')[1]){
                if(id.search('CUX') == -1){
                    common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
                    id_name = id.split('.')[2];
                    obj = getObject(id);
                    native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
                    meldungsart = id.split('.')[4];
                    var id_UNREACH = id.substring(0, id.lastIndexOf('.')+1) +'UNREACH_ALARM';
                    var statusUNREACH = getState(id_UNREACH).val;
                    
                    var status = getState(id).val;                                  
                    var status_text = func_translate_status(meldungsart, native_type, status);
                    var datum_seit = func_get_datum(id);
                    
                    if (status === 1 && no_observation.search(id_name) != -1) {
                        ++Betroffen_no_observation
                        ++Betroffen_STICKY_UNREACH_no_observation
                    }

                    if (status === 1 && no_observation.search(id_name) == -1) {
                        var log_autoAck = common_name +' ('+id_name +')';
                        ++Betroffen;
                        ++Betroffen_STICKY_UNREACH;
                        if(prio < prio_STICKY_UNREACH){prio = prio_STICKY_UNREACH;}
                    
                        if(timer_sticky_unreach){
                            clearTimeout(timer_sticky_unreach);
                            timer_sticky_unreach = null;
                        }
                        timer_sticky_unreach = setTimeout(function() {
                            statusUNREACH = getState(id_UNREACH).val;
                            timer_sticky_unreach = null;
                            if(autoAck && statusUNREACH != 1){
                                if(logging){
                                    log(log_autoAck + ' - Hinweis über bestätigbare Kommunikationsstörung wird jetzt gelöscht.');
                                }
                                setStateDelayed(id,2);  
                                
                            }
                        }, 180 * 1000);  // 180 Sekunden Verzögerung
                        if(autoAck){
                            if(with_time && datum_seit !== ''){
                                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Meldung über bestätigbare Kommunikationsstörung gelöscht.</font> ' +datum_seit);
                                servicemeldung.push(common_name +' ('+id_name +')' + ' - Meldung über bestätigbare Kommunikationsstörung gelöscht. ' +datum_seit);
                            }
                            else{
                                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Meldung über bestätigbare Kommunikationsstörung gelöscht.</font> ');
                                servicemeldung.push(common_name +' ('+id_name +')' + ' - Meldung über bestätigbare Kommunikationsstörung gelöscht. ');    
                            }
                            
                        }
                        else {
                            if(with_time && datum_seit !== ''){
                                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">bestätigbare Kommunikationsstörung.</font>');
                                servicemeldung.push(common_name +' ('+id_name +')' + ' - bestätigbare Kommunikationsstörung.');
                            }
                            else{
                                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">bestätigbare Kommunikationsstörung.</font>');
                                servicemeldung.push(common_name +' ('+id_name +')' + ' - bestätigbare Kommunikationsstörung.');
                            }
                        }
                    
                    }  
                    ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
                    ++Gesamt_STICKY_UNREACH;
                    
                    if(show_each_device && log_manuell){
                        log('Geräte Nr. ' +(i + 1)  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
                    }
                }
                else{
                    log('[Script wird gestoppt] STICKY:_UNREACH: Die Cuxd-Instanz wurde im Script auf ' +CUXD +' gestellt. Ein Objekt hat folgenden Namen: ' +id ,'warn');
                    return false;
                }
            }
        }
        else{
            log('[Script wird gestoppt] Der Datenpunkt ' +id +' existiert nicht.', 'warn'); 
            return false;  
        }                                             
    }); 

    // Schleife ist durchlaufen. 
    if(Gesamt_STICKY_UNREACH === 0){
        if(log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt STICKY_UNREACH.');
        }
    }
    else{
        if(Betroffen_STICKY_UNREACH_no_observation > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_STICKY_UNREACH +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_STICKY_UNREACH_no_observation +' unterdrückte Servicemeldung(en).');    
            }
        }
        if(Betroffen_STICKY_UNREACH > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_STICKY_UNREACH +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_STICKY_UNREACH +' Servicemeldung(en).');    
            }
            if(write_state){
                if(existsObject(id_IST_STICKY_UNREACH)){
                    setState(id_IST_STICKY_UNREACH,Betroffen_STICKY_UNREACH);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für STICKY_UNREACH nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
        else{
            if((log_manuell) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_STICKY_UNREACH +' Geräte mit dem Datenpunkt STICKY_UNREACH.');
            
            }
            if(write_state){
                if(existsObject(id_IST_STICKY_UNREACH)){
                    setState(id_IST_STICKY_UNREACH,0);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für STICKY_UNREACH nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
    }
    
    SelectorERROR.each(function (id, i) {
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status > 1  && status < 7 && no_observation.search(id_name) != -1) {
            ++Betroffen_no_observation
            ++Betroffen_ERROR_no_observation
        }
        else if  (status == 7 && no_observation.search(id_name) != -1) {
            ++Betroffen_no_observation
            ++Betroffen_SABOTAGE_no_observation
        }
        if (status > 1 && status < 7 && no_observation.search(id_name) == -1) { 
            ++Betroffen;
            ++Betroffen_ERROR;
            if(prio < prio_ERROR){prio = prio_ERROR;}
        }
        else if (status == 7 && no_observation.search(id_name) == -1) { 
            ++Betroffen;
            ++Betroffen_SABOTAGE;
            if(prio < prio_SABOTAGE){prio = prio_SABOTAGE;}
        }

        if (status > 1 && no_observation.search(id_name) == -1) {      // wenn Zustand größer 1, dann wird die Anzahl der Geräte hochgezählt
            
       
            if(with_time && datum_seit !== ''){
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">'+status_text +'.</font> ' +datum_seit);
                servicemeldung.push(common_name +' ('+id_name +')' + ' - '+status_text +datum_seit);
            }
            else{
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">'+status_text +'.</font> ');
                servicemeldung.push(common_name +' ('+id_name +')' + ' - '+status_text);    
            }
            
        
        }  
        ++Gesamt;           // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_ERROR

        if(show_each_device && log_manuell){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_ERROR === 0){
        if(log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt ERROR.');
        }
    }
    else{
        if(Betroffen_ERROR_no_observation > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_ERROR +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_ERROR_no_observation +' unterdrückte Servicemeldung(en).');    
            }
        }
        if(Betroffen_ERROR > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_ERROR +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_ERROR +' Servicemeldung(en).');    
            }
            if(write_state){
                if(existsObject(id_IST_ERROR)){
                    setState(id_IST_ERROR,Betroffen_ERROR);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für ERROR nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
        else{
            if((log_manuell) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_ERROR +' Geräte mit dem Datenpunkt ERROR.');
            
            }
            if(write_state){
                if(existsObject(id_IST_ERROR)){
                    setState(id_IST_ERROR,0);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für ERROR nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
    }

    SelectorSABOTAGE.each(function (id, i) { 
                              
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj    = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status == 1 && no_observation.search(id_name) != -1) {
            ++Betroffen_no_observation
            ++Betroffen_SABOTAGE_no_observation
        }

        if(status == 1 && native_type =='HmIP-HEATING'){
            if(debugging){
                log(common_name +' ('+id_name +') hat eine Sabotage gemeldet. Da es eine Heizungsgruppe ist erfolgt keine Push');
            }
        }

        if (status == 1 && no_observation.search(id_name) == -1 && native_type !='HmIP-HEATING') {      
            ++Betroffen;
            ++Betroffen_SABOTAGE;
            if(prio < prio_SABOTAGE){prio = prio_SABOTAGE;}
            if(with_time && datum_seit !== ''){
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">' +status_text +'.</font> ' +datum_seit);
                servicemeldung.push(common_name +' ('+id_name +')' + ' - ' +status_text +'.' +datum_seit);
            }
            else{
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">' +status_text +'.</font> ');
                servicemeldung.push(common_name +' ('+id_name +')' + ' - ' +status_text +'.');    
            }
            
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_SABOTAGE;
        
        if(show_each_device && log_manuell){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_SABOTAGE === 0){
        if(log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt SABOTAGE.');
        }
    }
    else{
        if(Betroffen_SABOTAGE_no_observation > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_SABOTAGE +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_SABOTAGE_no_observation +' unterdrückte Servicemeldung(en).');    
            }
        }
        if(Betroffen_SABOTAGE > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_SABOTAGE +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_SABOTAGE +' Servicemeldung(en).');    
            }
            if(write_state){
                if(existsObject(id_IST_SABOTAGE)){
                    setState(id_IST_SABOTAGE,Betroffen_SABOTAGE);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für SABOTAGE nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
        else{
            if((log_manuell) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_SABOTAGE +' Geräte mit dem Datenpunkt SABOTAGE.');
            
            }
            if(write_state){
                if(existsObject(id_IST_SABOTAGE)){
                    setState(id_IST_SABOTAGE,0);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für SABOTAGE nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
    }
    
    
    SelectorERROR_NON_FLAT_POSITIONING.each(function (id, i) { 
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status === 1 && no_observation.search(id_name) != -1) {
            ++Betroffen_no_observation
            ++Betroffen_ERROR_NON_FLAT_POSITIONING_no_observation
        }

        if (status === 1 && no_observation.search(id_name) == -1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            ++Betroffen_ERROR_NON_FLAT_POSITIONING
            if(prio < prio_ERROR_NON_FLAT_POSITIONING){prio = prio_ERROR_NON_FLAT_POSITIONING;}
            if(with_time && datum_seit !== ''){
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">wurde angehoben.</font> ' +datum_seit);
                servicemeldung.push(common_name +' ('+id_name +')' + ' - wurde angehoben.' +datum_seit);
            }
            else{
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">wurde angehoben.</font> ');
                servicemeldung.push(common_name +' ('+id_name +')' + ' - wurde angehoben.');    
            }
            
        
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_ERROR_NON_FLAT_POSITIONING

        if(show_each_device && log_manuell){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    });
    
    // Schleife ist durchlaufen. 
    if(Gesamt_ERROR_NON_FLAT_POSITIONING === 0){
        if(log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt ERROR_NON_FLAT_POSITIONING.');
        }
    }
    else{
        if(Betroffen_ERROR_NON_FLAT_POSITIONING_no_observation > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_ERROR_NON_FLAT_POSITIONING +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_ERROR_NON_FLAT_POSITIONING_no_observation +' unterdrückte Servicemeldung(en).');    
            }
        }
        if(Betroffen_ERROR_NON_FLAT_POSITIONING > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_ERROR_NON_FLAT_POSITIONING +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_ERROR_NON_FLAT_POSITIONING +' Servicemeldung(en).');    
            }
            if(write_state){
                if(existsObject(id_IST_ERROR_NON_FLAT_POSITIONING)){
                    setState(id_IST_ERROR_NON_FLAT_POSITIONING,Betroffen_ERROR_NON_FLAT_POSITIONING);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für ERROR_NON_FLAT_POSITIONING nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
        else{
            if((log_manuell) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_ERROR_NON_FLAT_POSITIONING +' Geräte mit dem Datenpunkt ERROR_NON_FLAT_POSITIONING.');
            
            }
            if(write_state){
                if(existsObject(id_IST_ERROR_NON_FLAT_POSITIONING)){
                    setState(id_IST_ERROR_NON_FLAT_POSITIONING,0);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für ERROR_NON_FLAT_POSITIONING nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
    }
    
    SelectorFAULT_REPORTING.each(function (id, i) {                        
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj    = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status == 1 && no_observation.search(id_name) != -1) {
            ++Betroffen_no_observation
            ++Betroffen_FAULT_REPORTING_no_observation
        }

        if (status == 1 && no_observation.search(id_name) == -1) {      // wenn Zustand größer 0, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            ++Betroffen_FAULT_REPORTING;
            if(prio < prio_FAULT_REPORTING){prio = prio_FAULT_REPORTING;}
            if(with_time && datum_seit !== ''){
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">' +status_text +'.</font> ' +datum_seit);
                servicemeldung.push(common_name +' ('+id_name +')' + ' - ' +status_text +'.' +datum_seit);
            }
            else{
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">' +status_text +'.</font> ');
                servicemeldung.push(common_name +' ('+id_name +')' + ' - ' +status_text +'.');    
            }
            
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_FAULT_REPORTING;

        if(show_each_device && log_manuell){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_FAULT_REPORTING === 0){
        if(log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt FAULT_REPORTING.');
        }
    }
    else{
        if(Betroffen_FAULT_REPORTING_no_observation > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_FAULT_REPORTING +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_FAULT_REPORTING_no_observation +' unterdrückte Servicemeldung(en).');    
            }
        }
        if(Betroffen_FAULT_REPORTING > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_FAULT_REPORTING +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_FAULT_REPORTING +' Servicemeldung(en).');    
            }
            if(write_state){
                if(existsObject(id_IST_FAULT_REPORTING)){
                    setState(id_IST_FAULT_REPORTING,Betroffen_FAULT_REPORTING);
                   
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für FAULT_REPORTING nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
        else{
            if((log_manuell) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_FAULT_REPORTING +' Geräte mit dem Datenpunkt FAULT_REPORTING.');
            
            }
            if(write_state){
                if(existsObject(id_IST_FAULT_REPORTING)){
                    setState(id_IST_FAULT_REPORTING,0);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für FAULT_REPORTING nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
    }
    
    SelectorDEVICE_IN_BOOTLOADER.each(function (id, i) {                         
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status === 1 && no_observation.search(id_name) != -1) {
            ++Betroffen_no_observation
            ++Betroffen_DEVICE_IN_BOOTLOADER_no_observation
        }

        if (status === 1 && no_observation.search(id_name) == -1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            ++Betroffen_DEVICE_IN_BOOTLOADER;
            if(prio < prio_DEVICE_IN_BOOTLOADER){prio = prio_DEVICE_IN_BOOTLOADER;}
            if(with_time && datum_seit !== ''){
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Gerät startet neu.</font> ' +datum_seit);
                servicemeldung.push(common_name +' ('+id_name +')' + ' - Gerät startet neu.' +datum_seit);
            }
            else{
                 formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Gerät startet neu.</font> ');
                servicemeldung.push(common_name +' ('+id_name +')' + ' - Gerät startet neu.');    
            }
            
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_DEVICE_IN_BOOTLOADER;

        if(show_each_device && log_manuell){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_DEVICE_IN_BOOTLOADER === 0){
        if(log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt DEVICE_IN_BOOTLOADER.');
        }
    }
    else{
        if(Betroffen_DEVICE_IN_BOOTLOADER_no_observation > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_DEVICE_IN_BOOTLOADER +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_DEVICE_IN_BOOTLOADER_no_observation +' unterdrückte Servicemeldung(en).');    
            }
        }
        if(Betroffen_DEVICE_IN_BOOTLOADER > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_DEVICE_IN_BOOTLOADER +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_DEVICE_IN_BOOTLOADER +' Servicemeldung(en).');    
            }
            if(write_state){
                if(existsObject(id_IST_DEVICE_IN_BOOTLOADER)){
                    setState(id_IST_DEVICE_IN_BOOTLOADER,Betroffen_DEVICE_IN_BOOTLOADER);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für DEVICE_IN_BOOTLOADER nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
        else{
            if((log_manuell) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_DEVICE_IN_BOOTLOADER +' Geräte mit dem Datenpunkt DEVICE_IN_BOOTLOADER.');
            
            } 
            if(write_state){
                if(existsObject(id_IST_DEVICE_IN_BOOTLOADER)){
                    setState(id_IST_DEVICE_IN_BOOTLOADER,0);
                   
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für DEVICE_IN_BOOTLOADER nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
    }
    
    SelectorCONFIG_PENDING.each(function (id, i) {                         
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status === 1 && no_observation.search(id_name) != -1) {
            ++Betroffen_no_observation
            ++Betroffen_CONFIG_PENDING_no_observation
        }
        if(status == 1 && native_type =='HmIP-HEATING'){
            if(debugging){
                log(common_name +' ('+id_name +') hat eine Servicemeldung gemeldet. Da es eine Heizungsgruppe ist erfolgt keine Push');
            }
        }

        if (status == 1 && no_observation.search(id_name) == -1 && native_type !='HmIP-HEATING') {   
            ++Betroffen;
            ++Betroffen_CONFIG_PENDING;
            if(prio < prio_CONFIG_PENDING){prio = prio_CONFIG_PENDING;}
            if(with_time && datum_seit !== ''){
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Konfigurationsdaten stehen zur Übertragung an.</font> ' +datum_seit);
                servicemeldung.push(common_name +' ('+id_name +')' + ' - Konfigurationsdaten stehen zur Übertragung an. ' +datum_seit);
            }
            else{
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Konfigurationsdaten stehen zur Übertragung an.</font> ');
                servicemeldung.push(common_name +' ('+id_name +')' + ' - Konfigurationsdaten stehen zur Übertragung an. ');    
            }
            
        }  
        ++Gesamt;       // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_CONFIG_PENDING;

        if(show_each_device && log_manuell){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_CONFIG_PENDING === 0){
        if(log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt CONFIG_PENDING.');
        }
    }
    else{
        if(Betroffen_CONFIG_PENDING_no_observation > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_CONFIG_PENDING +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_CONFIG_PENDING_no_observation +' unterdrückte Servicemeldung(en).');    
            }
        }
        if(Betroffen_CONFIG_PENDING > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_CONFIG_PENDING +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_CONFIG_PENDING +' Servicemeldung(en).');    
            }
            if(write_state){
                if(existsObject(id_IST_CONFIG_PENDING)){
                    setState(id_IST_CONFIG_PENDING,Betroffen_CONFIG_PENDING);
                   
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für CONFIG_PENDING nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
        else{
            if((log_manuell) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_CONFIG_PENDING +' Geräte mit dem Datenpunkt CONFIG_PENDING.');
            
            }
            if(write_state){
                if(existsObject(id_IST_CONFIG_PENDING)){
                    setState(id_IST_CONFIG_PENDING,0);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für CONFIG_PENDING nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
    }
    
    SelectorUPDATE_PENDING.each(function (id, i) {                         
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status === 1 && no_observation.search(id_name) != -1) {
            ++Betroffen_no_observation
            ++Betroffen_UPDATE_PENDING_no_observation
        }
        if(status == 1 && native_type =='HmIP-HEATING'){
            if(debugging){
                log(common_name +' ('+id_name +') hat eine Servicemeldung gemeldet. Da es eine Heizungsgruppe ist erfolgt keine Push');
            }
        }

        if (status == 1 && no_observation.search(id_name) == -1 && native_type !='HmIP-HEATING') {   
            ++Betroffen;
            ++Betroffen_UPDATE_PENDING;
            if(prio < prio_UPDATE_PENDING){prio = prio_UPDATE_PENDING;}
            if(with_time && datum_seit !== ''){
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Gerät startet neu.</font> ' +datum_seit);
                servicemeldung.push(common_name +' ('+id_name +')' + ' - Gerät startet neu. ' +datum_seit);
            }
            else{
                formatiert_servicemeldung.push(common_name +' ('+id_name +')' + ' - <font color="red">Gerät startet neu.</font> ');
                servicemeldung.push(common_name +' ('+id_name +')' + ' - Gerät startet neu. ');    
            }
            
           
         
        }  
        ++Gesamt;       // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_UPDATE_PENDING;

        if(show_each_device && log_manuell){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_UPDATE_PENDING === 0){
        if(log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt UPDATE_PENDING.');
        }
    }
    else{
        if(Betroffen_UPDATE_PENDING_no_observation > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_UPDATE_PENDING +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_UPDATE_PENDING_no_observation +' unterdrückte Servicemeldung(en).');    
            }
        }
        if(Betroffen_UPDATE_PENDING > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_UPDATE_PENDING +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_UPDATE_PENDING +' Servicemeldung(en).');    
            }
            if(write_state){
                if(existsObject(id_IST_UPDATE_PENDING)){
                    setState(id_IST_UPDATE_PENDING,Betroffen_UPDATE_PENDING);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für UPDATE_PENDING nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
        else{
            if((log_manuell) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_UPDATE_PENDING +' Geräte mit dem Datenpunkt UPDATE_PENDING.');
            
            }
            if(write_state){
                if(existsObject(id_IST_UPDATE_PENDING)){
                    setState(id_IST_UPDATE_PENDING,0);
                    
                }
                else{
                    if(debugging){
                        log('[DEBUG] ' +'id_IST Feld für UPDATE_PENDING nicht gefüllt');
                    
                    }    
                }
        
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Variable write_state steht auf false');
                    
                }    
            }
        }
    }
    
    
    //Verarbeitung aller Datenpunkte
    if(Betroffen_no_observation > 0){    
        if(debugging){
            log('[DEBUG] ' +'Derzeit gibt es insgesamt ' +Betroffen_no_observation +' unterdrückte Servicemeldungen');
        }
    }
    
    //if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
    if(Betroffen > 0){
        if(debugging){
            log('[DEBUG] ' +'Betroffen mehr als 0. Es sind '+Betroffen);
            log('[DEBUG] ' +'log_manuell: '+log_manuell);
        }
        if(write_state){
            if(!existsState(id_IST_Gesamt)){
                if(debugging){
                    log('[DEBUG] ' +'Feld id_IST_Gesamt nicht ausgewählt');
                }
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Derzeit gibt es Servicemeldungen. Ergebnis in Objekt geschrieben');
                    log('[DEBUG] ' +'Betroffen: '+Betroffen);
                }
                setState(id_IST_Gesamt,Betroffen);
            }
        }
        else{
            if(debugging){
                log('[DEBUG] ' +'Variable write_state steht auf false');
                
            }     
        }
        if(write_message){
            if(!existsState(id_Text_Servicemeldung)){
                if(debugging){
                    log('[DEBUG] ' +'Feld id_Text_Servicemeldung nicht ausgewählt');
                }    
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'write_message steht auf true. Ergebnis in Objekt geschrieben');
                    log('[DEBUG] ' +'Betroffen: '+servicemeldung.join(', '));
                }
                setState(id_Text_Servicemeldung,servicemeldung.join(', '));    
            }    
        }
        else{
            if(debugging){
                log('[DEBUG] ' +'Variable write_message steht auf false');
                
            }     
        }
        
        
        if(meldung_neu != servicemeldung){
            meldung_alt = meldung_neu;
            meldung_neu = servicemeldung;
            if(debugging){
                log('[DEBUG] ' +'meldung alt und neu geändert');
            }
            
        }
        else{
            if(debugging && !log_manuell){
                log('[DEBUG] ' +'Else Teil Meldung_neu');
            }
            meldung_neu = ['Derzeit keine neue Servicemeldung'];
        }
        
        
        if(timer){
            clearTimeout(timer);
            timer = null;
            if(debugging){
                log('[DEBUG] ' +'Es gibt bereits eine Servicemeldung. Abruch des Timers .');
                
            }
            if(debugging){
                log('[DEBUG] ' +'Übersicht aller Servicemeldungen: '+ servicemeldung.join(', '));
            }
            //Push verschicken (20.11.19 hinzugefügt wegen doppelter Meldung)
            //meldung_neu = meldung_neu.filter(item => !meldung_alt.includes(item));
            //if(meldung_neu.length === 0){
                if(debugging && !log_manuell){
                    log('[DEBUG] ' +'Pushnachricht unterdrückt, da es über diese Servicemeldung bereits eine Push gab.');
                }
            //}
            //else{
                //Push verschicken
                if((sendpush && !log_manuell) || (sendpush_LOWBAT_neu && !log_manuell)) {
                    //prio wird durch Servicemeldung vergeben 
                    titel = 'Servicemeldung';
                    message = formatiert_servicemeldung.join('\n');
                    send_pushover(device, message, titel, prio);
                    if(debugging){
                        log('[DEBUG] '+'Pushover wurde verschickt');
                    }
                }
                else{
                    if(debugging){
                        log('Sendpush:' +sendpush +' --- log_manuel: '+log_manuell);
                    }

                }
                if(sendtelegram && !log_manuell){
                    message = servicemeldung.join('\n');
                    send_telegram(message, user_telegram);
                    if(debugging){
                        log('[DEBUG] '+'Telegram wurde verschickt');
                    }
                }
                else{
                    if(debugging){
                        log('Sendtelegram:' +sendtelegram +' --- log_manuel: '+log_manuell);
                    }

                }
                if(sendmail && !log_manuell){
                    message = servicemeldung.join('\n');
                    send_mail(message);
                    if(debugging){
                        log('[DEBUG] '+'Mail wurde verschickt');
                    }
                }
                else{
                    if(debugging){
                        log('Sendmail:' +sendmail +' --- log_manuel: '+log_manuell);
                    }

                }
            //}
                
            
        }
        else{
            timer = setTimeout(function() {
                timer = null;
                if(debugging && !log_manuell){
                    log('[DEBUG] ' +'Timer abgelaufen. Verarbeitung der Servicemeldung');
                    
                }
                
                if(debugging || log_manuell){
                    log('Es werden: '+Gesamt +' Datenpunkte überwacht. Derzeit: '+Betroffen +' Servicemeldung(en).');
                }
                if(Betroffen == 1){
                    if(debugging){
                        log('[DEBUG] ' +'Es gibt eine Servicemeldung: ' + servicemeldung.join(', '));
                    }   
                }
                if(Betroffen >1){
                    if(debugging){
                        log('[DEBUG] ' +'Übersicht aller Servicemeldungen: '+ servicemeldung.join(', '));
                    }   
                }
                //Push verschicken
                meldung_neu = meldung_neu.filter(item => !meldung_alt.includes(item));
                if(meldung_neu.length === 0){
                    if(debugging && !log_manuell){
                        log('[DEBUG] ' +'Pushnachricht unterdrückt, da es über diese Servicemeldung bereits eine Push gab.');
                    }
                }
                else{
                    //log('Test: '+meldung_neu);
                    if(sendpush && !log_manuell){
                        //prio = 0; 
                        titel = 'Servicemeldung';
                        message = formatiert_servicemeldung.join('\n');
                        send_pushover(device, message, titel, prio);
                    }
                    if(sendtelegram && !log_manuell){
                        message = servicemeldung.join('\n');
                        send_telegram(message, user_telegram);
                    }
                    if(sendmail && !log_manuell){
                        message = servicemeldung.join('\n');
                        send_mail(message);
                    }
                        
                }
                
            }, 3 * 1000);  // 3 Sekunden Verzögerung
        }
        
        
    }
    else{
        meldung_alt = ['Derzeit keine Servicemedungen.'];
        
        if((debugging) || (onetime && log_manuell)){
            log(Gesamt +' Datenpunkte werden insgesamt vom Script ' +name +' (Version: '+Version +') überwacht. Instance: '+instance);
            log('logging: '+logging +' debugging: '+debugging +' find_bug: '+find_bug +' show_each_device: ' +show_each_device +' autoAck: '+autoAck +' observation: '+ observation +' ohnetime: '+onetime +' CUXD: '+CUXD);

            
            
        }
        if(write_message){
            if(existsState(id_Text_Servicemeldung)){
                setState(id_Text_Servicemeldung,'Derzeit keine Servicemeldungen');    
            }    
        }
        if(write_state){
            if(!existsState(id_IST_Gesamt)){
                if(debugging){
                    log('[DEBUG] ' +'Feld id_IST_Gesamt nicht ausgewählt');
                }
            }
            else{
                if(debugging){
                    log('[DEBUG] ' +'Derzeitige keine Servicemeldungen. Ergebnis in Objekt geschrieben');
                }
                setState(id_IST_Gesamt,0);
            }
        }
                
    }
    
 
}

//Auslösen durch Zustandsänderung
if(observation){
    SelectorUNREACH.on(function(obj) {   
        Servicemeldung(obj);
    });
    SelectorSTICKY_UNREACH.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorSABOTAGE.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorERROR.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorLOWBAT.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorLOW_BAT.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorERROR_NON_FLAT_POSITIONING.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorFAULT_REPORTING.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorCONFIG_PENDING.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorUPDATE_PENDING.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorDEVICE_IN_BOOTLOADER.on(function(obj) {    
        Servicemeldung(obj);
    });
    
}


if(onetime){
    //beim Start
    Servicemeldung();
    
} 
