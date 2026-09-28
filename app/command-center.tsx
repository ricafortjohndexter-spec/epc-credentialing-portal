"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./command-center.module.css";

type Provider={id:number;name:string;credentials:string;npi:string;specialty:string;location:string;active:boolean};
type Payer={id:number;name:string;category:string;trackingMode:string;contractStatus:string;relevance:string;scope:string};
type Credential={id:number;providerId:number;payerId:number;status:string;followUpDate:string;priority:string;assignedTo:string;nextAction:string;effectiveDate:string;updatedAt:string};
type Activity={id:number;action:string;entityType:string;entityName:string;detail:string;createdAt:string};
type PortalData={providers:Provider[];payers:Payer[];credentials:Credential[];activity:Activity[];settings:Record<string,string>};
type EftEra={payerId:number;eftStatus:string;eraStatus:string;enrollmentMethod:string;submittedDate:string;effectiveDate:string;followUpDate:string;assignedTo:string;notes:string};

type Section="dashboard"|"providers"|"payers"|"contracts"|"credentialing"|"eft"|"medicare"|"lab"|"tasks"|"documents"|"rates"|"locations"|"contacts"|"activity";

const nav:[Section,string][]=[
 ["dashboard","Dashboard"],["providers","1  Providers"],["payers","2  Payers"],["contracts","3  Payer Contracts"],["credentialing","4  Provider Credentialing"],["eft","5  EFT / ERA / EDI"],["medicare","6  Medicare"],["lab","7  Lab Credentialing"],["tasks","8  Tasks & Follow-Ups"],["documents","9  Documents"],["rates","10 Rate Contracting"],["locations","11 Locations"],["contacts","12 Contacts"],["activity","13 Activity Log"]
];

function eftRows(settings:Record<string,string>):EftEra[]{try{const x=JSON.parse(settings.eftEraRecords||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
function badgeClass(status:string){const s=status.toLowerCase();if(s.includes("approved")||s.includes("active")||s.includes("network"))return styles.success;if(s.includes("denied")||s.includes("reject")||s.includes("overdue"))return styles.danger;if(s.includes("pending")||s.includes("progress")||s.includes("submitted"))return styles.warning;if(s.includes("not started")||s.includes("not applied"))return styles.muted;return styles.info}
function shortStatus(status:string){return status||"Unknown"}

export default function CommandCenter(){
 const [data,setData]=useState<PortalData>({providers:[],payers:[],credentials:[],activity:[],settings:{}});
 const [loading,setLoading]=useState(true);const [section,setSection]=useState<Section>("dashboard");const [error,setError]=useState("");
 useEffect(()=>{fetch("/api/data").then(r=>r.json()).then(x=>{setData(x);setLoading(false)}).catch(e=>{setError(String(e));setLoading(false)})},[]);
 const providerMap=useMemo(()=>new Map(data.providers.map(x=>[x.id,x])),[data.providers]);
 const payerMap=useMemo(()=>new Map(data.payers.map(x=>[x.id,x])),[data.payers]);
 const efts=useMemo(()=>eftRows(data.settings),[data.settings]);
 const activeProviders=data.providers.filter(x=>x.active).length;
 const activePayers=data.payers.filter(x=>x.trackingMode==="Active");
 const approved=data.credentials.filter(x=>x.status==="Approved").length;
 const pending=data.credentials.filter(x=>["Application Submitted","In Progress","Pending"].includes(x.status)).length;
 const denied=data.credentials.filter(x=>x.status==="Denied").length;
 const notStarted=data.credentials.filter(x=>x.status==="Not Started").length;
 const eftActive=efts.filter(x=>x.eftStatus==="Active"||x.eraStatus==="Active").length;
 const eftPending=efts.filter(x=>[x.eftStatus,x.eraStatus].some(s=>s&&s!=="Active"&&s!=="Not Required"&&s!=="Not Started")).length;
 const contractEffective=data.payers.filter(x=>/delegated contract on file|effective|active/i.test(x.contractStatus||"")).length;
 const contractPending=Math.max(activePayers.length-contractEffective,0);
 const today=new Date();today.setHours(0,0,0,0);
 const overdue=data.credentials.filter(x=>x.followUpDate&&new Date(x.followUpDate+"T00:00:00")<today&&x.status!=="Approved").length;
 const due7=data.credentials.filter(x=>{if(!x.followUpDate||x.status==="Approved")return false;const d=(new Date(x.followUpDate+"T00:00:00").getTime()-today.getTime())/86400000;return d>=0&&d<=7}).length;
 const categories=Array.from(new Set(data.providers.map(p=>/diet/i.test(p.specialty)?"Dietitian":/psy|mental|behavior/i.test(p.specialty)?"Mental Health":/lab/i.test(p.specialty)?"Lab":"Endocrinology"));
 const providerGroups=categories.map(c=>[c,data.providers.filter(p=>(c==="Dietitian"?/diet/i.test(p.specialty):c==="Mental Health"?/psy|mental|behavior/i.test(p.specialty):c==="Lab"?/lab/i.test(p.specialty):!/diet|psy|mental|behavior|lab/i.test(p.specialty))).length] as const);
 const payerCats=Array.from(new Set(activePayers.map(p=>p.category||"Other"))).slice(0,6).map(c=>[c,activePayers.filter(p=>(p.category||"Other")===c).length] as const);
 const topPayers=activePayers.map(p=>[p.name,data.credentials.filter(c=>c.payerId===p.id&&c.status!=="Not Applicable").length] as const).sort((a,b)=>b[1]-a[1]).slice(0,7);
 const recentTasks=data.credentials.filter(x=>x.status!=="Approved"&&x.status!=="Not Applicable").sort((a,b)=>(a.followUpDate||"9999").localeCompare(b.followUpDate||"9999")).slice(0,7);
 const maxProvider=Math.max(1,...providerGroups.map(x=>x[1])); const maxPayer=Math.max(1,...payerCats.map(x=>x[1])); const maxTop=Math.max(1,...topPayers.map(x=>x[1]));
 const totalCred=Math.max(approved+pending+denied+notStarted,1);const a=Math.round(approved/totalCred*100),p=Math.round(pending/totalCred*100),d=Math.round(denied/totalCred*100);
 const credentialDonut={background:`conic-gradient(#21a45d 0 ${a}%,#f5c542 ${a}% ${a+p}%,#ef5350 ${a+p}% ${a+p+d}%,#9aa9b7 ${a+p+d}% 100%)`};
 const contractTotal=Math.max(activePayers.length,1);const ce=Math.round(contractEffective/contractTotal*100);const contractDonut={background:`conic-gradient(#21a45d 0 ${ce}%,#f5c542 ${ce}% 100%)`};
 const eftTotal=Math.max(eftActive+eftPending,1);const ea=Math.round(eftActive/eftTotal*100);const eftDonut={background:`conic-gradient(#21a45d 0 ${ea}%,#f5c542 ${ea}% 100%)`};

 return <div className={styles.shell}>
  <aside className={styles.sidebar}><div className={styles.brand}><div className={styles.brandTitle}>EPC</div><div className={styles.brandSub}>Endocrine and Psychiatry Center<br/>Credentialing Command Center</div></div><div className={styles.nav}>{nav.map(([id,label])=><button key={id} className={section===id?styles.active:""} onClick={()=>setSection(id)}>{label}</button>)}</div><a className={styles.legacy} href="/legacy">Open legacy portal ↗</a></aside>
  <div className={styles.main}><header className={styles.topbar}><div className={styles.title}><h1>Credentialing Command Center</h1><p>Provider Enrollment · Payer Contracting · EFT / ERA / EDI · Medicare · Mental Health · Lab</p></div><div className={styles.filters}><span className={styles.filter}>Today: {new Date().toLocaleDateString()}</span><span className={styles.filter}>Department: All</span><span className={styles.filter}>Managed By: All</span></div></header>
  <main className={styles.content}>{loading?<div className={styles.empty}>Loading EPC operational data…</div>:error?<div className={styles.empty}>Unable to load live data: {error}</div>:section==="dashboard"?<>
   <div className={styles.kpis}>
    <Kpi c="blue" label="Total Providers" value={data.providers.length} meta1={`Active ${activeProviders}`} meta2={`Inactive ${data.providers.length-activeProviders}`}/>
    <Kpi c="green" label="Payer Contracts" value={activePayers.length} meta1={`Effective ${contractEffective}`} meta2={`Pending ${contractPending}`}/>
    <Kpi c="purple" label="Provider Credentialing" value={data.credentials.length} meta1={`Approved ${approved}`} meta2={`Pending ${pending}`}/>
    <Kpi c="orange" label="EFT / ERA / EDI" value={efts.length} meta1={`Active ${eftActive}`} meta2={`Pending ${eftPending}`}/>
    <Kpi c="red" label="Medicare Enrollments" value="—" meta1="New module ready" meta2="Schema expansion next"/>
    <Kpi c="teal" label="Lab Credentialing" value="—" meta1="New module ready" meta2="CLIA + payer tracking"/>
   </div>
   <div className={styles.grid3}>
    <Donut title="Provider Credentialing Status" style={credentialDonut} total={data.credentials.length} rows={[["Approved",approved,"#21a45d"],["Pending",pending,"#f5c542"],["Denied",denied,"#ef5350"],["Not Started",notStarted,"#9aa9b7"]]}/>
    <Donut title="Payer Contract Status" style={contractDonut} total={activePayers.length} rows={[["Effective",contractEffective,"#21a45d"],["Pending",contractPending,"#f5c542"]]}/>
    <Donut title="EFT / ERA / EDI Enrollment Status" style={eftDonut} total={efts.length} rows={[["Active",eftActive,"#21a45d"],["Pending",eftPending,"#f5c542"]]}/>
   </div>
   <div className={styles.grid3}>
    <Bars title="Providers by Department" rows={providerGroups} max={maxProvider}/><Bars title="Contracts by Payer Category" rows={payerCats} max={maxPayer}/><Bars title="Aging Follow-Ups & Open Tasks" rows={[["Overdue",overdue],["Due ≤ 7 Days",due7],["Open Apps",pending],["Evidence",data.credentials.filter(x=>x.status==="Approved"&&!x.effectiveDate).length]]} max={Math.max(1,overdue,due7,pending)}/>
   </div>
   <div className={styles.grid3}><Bars title="Top Payers by Provider Count" rows={topPayers} max={maxTop}/><ModuleSummary title="Credentialing Pipeline" text="Live provider-payer records drive application aging, effective dates, priority and follow-up workload."/><ModuleSummary title="Document Expirations" text="The new architecture reserves licenses, DEA, malpractice, CAQH, W-9, CLIA, contracts, rosters and EFT documents for expiration tracking."/></div>
   <div className={`${styles.panel} ${styles.tablePanel}`}><div className={styles.sectionHeader}><h3>Recent Follow-Ups / Open Tasks</h3><button onClick={()=>setSection("tasks")}>View all →</button></div><TaskTable rows={recentTasks} providers={providerMap} payers={payerMap}/></div>
  </>:<SectionView section={section} data={data} efts={efts} providers={providerMap} payers={payerMap}/>}<div className={styles.footerNote}>Command Center v2 · Existing EPC API remains the live data source. New Medicare, Lab, Documents, Rates, Locations and Contacts modules are staged for schema-backed expansion.</div></main></div>
 </div>
}

function Kpi({c,label,value,meta1,meta2}:{c:string;label:string;value:number|string;meta1:string;meta2:string}){return <div className={`${styles.card} ${styles[c]}`}><div className={styles.cardLabel}>{label}</div><div className={styles.cardValue}>{value}</div><div className={styles.cardMeta}><span>{meta1}</span></div><div className={styles.cardMeta}><span>{meta2}</span></div></div>}
function Donut({title,style,total,rows}:{title:string;style:React.CSSProperties;total:number;rows:[string,number,string][]}){return <div className={styles.panel}><h3>{title}</h3><div className={styles.donutWrap}><div className={styles.donut} style={style}/><div className={styles.legend}>{rows.map(([l,v,c])=><div className={styles.legendRow} key={l}><span><i className={styles.dot} style={{background:c}}/>{l}</span><b>{v}</b></div>)}<div className={styles.small}>Total {total}</div></div></div></div>}
function Bars({title,rows,max}:{title:string;rows:readonly (readonly [string,number])[];max:number}){return <div className={styles.panel}><h3>{title}</h3><div className={styles.bars}>{rows.map(([l,v])=><div className={styles.barRow} key={l}><span>{l}</span><div className={styles.track}><div className={styles.fill} style={{width:`${Math.max(3,v/max*100)}%`}}/></div><b>{v}</b></div>)}</div></div>}
function ModuleSummary({title,text}:{title:string;text:string}){return <div className={styles.panel}><h3>{title}</h3><div className={styles.statusLine}/><p className={styles.small}>{text}</p></div>}
function TaskTable({rows,providers,payers}:{rows:Credential[];providers:Map<number,Provider>;payers:Map<number,Payer>}){return <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Due Date</th><th>Priority</th><th>Provider / Payer</th><th>Status</th><th>Next Action</th><th>Assigned To</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td>{r.followUpDate||"—"}</td><td><span className={`${styles.badge} ${r.priority==="High"?styles.danger:styles.info}`}>{r.priority||"Normal"}</span></td><td><b>{providers.get(r.providerId)?.name||"Unknown"}</b><br/><span className={styles.small}>{payers.get(r.payerId)?.name||"Unknown"}</span></td><td><span className={`${styles.badge} ${badgeClass(r.status)}`}>{shortStatus(r.status)}</span></td><td>{r.nextAction||"—"}</td><td>{r.assignedTo||"Unassigned"}</td></tr>):<tr><td colSpan={6}>No open tasks.</td></tr>}</tbody></table></div>}
function SectionView({section,data,efts,providers,payers}:{section:Section;data:PortalData;efts:EftEra[];providers:Map<number,Provider>;payers:Map<number,Payer>}){
 const labels:Record<Section,[string,string]>= {dashboard:["",""] ,providers:["Providers","Master clinical and laboratory provider directory."],payers:["Payers","Insurance carriers, products, networks and delegated relationships."],contracts:["Payer Contracts","Group-level contracting and network relationships."],credentialing:["Provider Credentialing","Provider + payer + network enrollment status."],eft:["EFT / ERA / EDI","Electronic payments, remittance and clearinghouse enrollment."],medicare:["Medicare","Novitas Part B enrollment, PTANs and reassignment tracking."],lab:["Lab Credentialing","CLIA, laboratory director and payer-specific lab enrollment."],tasks:["Tasks & Follow-Ups","Daily work queue across all credentialing operations."],documents:["Documents","Licenses, DEA, CAQH, W-9, malpractice, CLIA and contracts."],rates:["Rate Contracting","CPT allowable benchmarking and payer rate negotiations."],locations:["Locations","Practice sites, lab sites and billing identifiers."],contacts:["Contacts","Payer contracting, credentialing and provider-relations directory."],activity:["Activity Log","Chronological operational audit trail."]};
 const [title,body]=labels[section];
 if(section==="providers")return <GenericTable title={title} body={body} headers={["Provider","Credentials","NPI","Specialty","Location","Status"]} rows={data.providers.map(p=>[p.name,p.credentials,p.npi,p.specialty,p.location,p.active?"Active":"Inactive"])} />;
 if(section==="payers"||section==="contracts")return <GenericTable title={title} body={body} headers={["Payer","Category","Tracking","Contract Status","Scope"]} rows={data.payers.map(p=>[p.name,p.category,p.trackingMode,p.contractStatus,p.scope])}/>;
 if(section==="credentialing"||section==="tasks")return <><div className={styles.sectionHeader}><div><h2>{title}</h2><p className={styles.small}>{body}</p></div></div><div className={styles.panel}><TaskTable rows={data.credentials} providers={providers} payers={payers}/></div></>;
 if(section==="eft")return <GenericTable title={title} body={body} headers={["Payer","EFT","ERA","Method","Submitted","Follow-Up"]} rows={efts.map(r=>[payers.get(r.payerId)?.name||"Unknown",r.eftStatus,r.eraStatus,r.enrollmentMethod,r.submittedDate,r.followUpDate])}/>;
 if(section==="activity")return <GenericTable title={title} body={body} headers={["Date","Entity","Action","Details"]} rows={data.activity.slice(0,100).map(a=>[a.createdAt,`${a.entityType}: ${a.entityName}`,a.action,a.detail])}/>;
 const readiness:Record<string,string>={medicare:"PTAN, PECOS application, reassignment, MAC, effective date and group-link tracking.",lab:"CLIA status/type, laboratory director, payer enrollment, EFT/ERA and missing documents.",documents:"Expiration alerts for licenses, DEA, board certification, malpractice, CAQH, W-9, CLIA, contracts and rosters.",rates:"Payer allowed vs Medicare, requested/negotiated/final rates and effective dates.",locations:"Practice locations, NPI/TIN, service lines, site type and active status.",contacts:"Credentialing, contracting, EFT/ERA, provider relations and network-management contacts."};
 return <div><div className={styles.sectionHeader}><div><h2>{title}</h2><p className={styles.small}>{body}</p></div></div><div className={styles.moduleGrid}><div className={`${styles.card} ${styles.moduleCard}`}><h3>Architecture ready</h3><p>{readiness[section]||body}</p></div><div className={`${styles.card} ${styles.moduleCard}`}><h3>Live-data migration</h3><p>This module is included in the new EPC schema and will become fully editable as its backend table is migrated.</p></div><div className={`${styles.card} ${styles.moduleCard}`}><h3>Cross-linked records</h3><p>Provider, payer, contract, location and follow-up IDs will connect this module to the rest of the Command Center.</p></div><div className={`${styles.card} ${styles.moduleCard}`}><h3>Dashboard integration</h3><p>KPIs, aging, overdue items and upcoming expirations will flow back to the executive dashboard.</p></div></div></div>
}
function GenericTable({title,body,headers,rows}:{title:string;body:string;headers:string[];rows:(string|number|boolean|undefined)[][]}){return <div><div className={styles.sectionHeader}><div><h2>{title}</h2><p className={styles.small}>{body}</p></div></div><div className={styles.panel}><div className={styles.tableWrap}><table className={styles.table}><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.length?rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{String(v??"—")}</td>)}</tr>):<tr><td colSpan={headers.length}>No records yet.</td></tr>}</tbody></table></div></div></div>}
