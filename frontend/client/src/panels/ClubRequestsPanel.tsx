import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Alert, Empty, errMsg } from '../ui';
type RequestItem={id:number;clubId:number;clubName:string;studentName:string;status:string};
export default function ClubRequestsPanel(){
 const [items,setItems]=useState<RequestItem[]>([]);const [error,setError]=useState('');const [message,setMessage]=useState('');
 async function load(){try{const r=await api<{requests:RequestItem[]}>('/clubs/requests');setItems(r.requests);}catch(e){setError(errMsg(e));}}
 useEffect(()=>{load();},[]);
 async function decide(id:number,decision:'APPROVE'|'REJECT'){setError('');setMessage('');try{await api(`/clubs/requests/${id}/decision`,{method:'POST',body:{decision}});setMessage(`Request ${decision.toLowerCase()}d.`);load();}catch(e){setError(errMsg(e));}}
 return <Card title="Club membership requests">{message&&<Alert kind="success">{message}</Alert>}{error&&<Alert kind="error">{error}</Alert>}{items.length===0?<Empty>No pending requests for clubs you host or coordinate.</Empty>:items.map(x=><article className="post" key={x.id}><strong>{x.studentName}</strong><p>Requested to join <b>{x.clubName}</b></p><div className="row-actions"><button className="primary small" onClick={()=>decide(x.id,'APPROVE')}>Approve</button><button className="ghost small danger" onClick={()=>decide(x.id,'REJECT')}>Reject</button></div></article>)}</Card>;
}
