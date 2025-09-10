let r=null,u=null;chrome.runtime.onMessage.addListener((t,o,a)=>{if(t.action==="extractContent"){const n=t.options||{includeContent:!0,includeTitle:!0};try{const e={url:window.location.href,title:document.title,author:S(),description:T(),content:""};n.includeContent&&(e.content=k()),(!n.includeTitle||!e.title)&&(e.title=e.url),e.title&&(e.title=e.title.replace(/\r?\n|\r/g," ").trim()),a(e)}catch(e){console.error("Content extraction error:",e),a({url:window.location.href,title:document.title,author:"",description:"",content:"",error:!0,message:e instanceof Error?e.message:"Unknown error occurred during content extraction"})}}if(t.action==="showNotesDialog")try{const n={url:window.location.href,title:document.title,author:S(),description:T(),content:k()};u=n,L(n),a({success:!0})}catch(n){console.error("Error showing notes dialog:",n),a({success:!1,error:n instanceof Error?n.message:"Failed to show notes dialog"})}return!0});function k(){const t=document.querySelector("article")||document.querySelector("main")||document.querySelector(".main-content")||document.body;if(!t)return"";let o=t.innerText;const a=1e5;return o.length>a&&(o=o.substring(0,a)+"... (content truncated due to very large page)"),o}function S(){const t=['meta[name="author"]','meta[property="article:author"]','meta[name="twitter:creator"]','meta[property="og:site_name"]'];for(const n of t){const e=document.querySelector(n);if(e&&e.getAttribute("content"))return e.getAttribute("content")||""}const o=['[itemtype*="schema.org/Person"] [itemprop="name"]','[itemtype*="schema.org/Organization"] [itemprop="name"]'];for(const n of o){const e=document.querySelector(n);if(e&&e.textContent)return e.textContent.trim()}const a=[".byline",".author",".article-author"];for(const n of a){const e=document.querySelector(n);if(e&&e.textContent)return e.textContent.trim()}return""}function T(){const t=['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'];for(const o of t){const a=document.querySelector(o);if(a&&a.getAttribute("content"))return a.getAttribute("content")||""}return""}function L(t){try{if(l(),r=document.createElement("div"),r.id="tana-save-overlay",q(r,t),B(),!document.body){console.error("Cannot show overlay: document.body is not available");return}document.body.appendChild(r),A(),setTimeout(()=>{const o=r?.querySelector("#tana-notes-input");o&&o.focus()},100)}catch(o){console.error("Error showing overlay:",o),l()}}function l(){r&&(document.removeEventListener("keydown",C,!0),r.remove(),r=null,u=null);const t=document.getElementById("tana-overlay-styles");t&&t.remove()}function q(t,o){const a=o.title.length>60?o.title.substring(0,60)+"...":o.title,n=o.url.length>50?o.url.substring(0,50)+"...":o.url,e=document.createElement("div");e.className="tana-overlay-backdrop";const i=document.createElement("div");i.className="tana-overlay-dialog";const f=document.createElement("div");f.className="tana-overlay-header";const E=document.createElement("h2");E.textContent="Save to Tana";const c=document.createElement("button");c.type="button",c.className="tana-overlay-close",c.id="tana-close-overlay",c.innerHTML=`<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M13.5 4.5l-9 9M4.5 4.5l9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,f.appendChild(E),f.appendChild(c);const p=document.createElement("div");p.className="tana-overlay-content";const x=document.createElement("div");x.className="tana-overlay-preview";const y=document.createElement("div");y.className="tana-overlay-page-info";const h=document.createElement("div");h.className="tana-overlay-page-title",h.textContent=a;const w=document.createElement("div");w.className="tana-overlay-page-url",w.textContent=n,y.appendChild(h),y.appendChild(w),x.appendChild(y);const v=document.createElement("div");v.className="tana-overlay-notes-section";const b=document.createElement("label");b.setAttribute("for","tana-notes-input"),b.className="tana-overlay-label",b.textContent="Add notes (optional)";const s=document.createElement("textarea");s.id="tana-notes-input",s.className="tana-overlay-notes-input",s.placeholder="Add your notes here...",s.rows=4,v.appendChild(b),v.appendChild(s);const g=document.createElement("div");g.className="tana-overlay-actions";const m=document.createElement("button");m.type="button",m.className="tana-overlay-button tana-overlay-button-secondary",m.id="tana-cancel-save",m.textContent="Cancel";const d=document.createElement("button");d.type="button",d.className="tana-overlay-button tana-overlay-button-primary",d.id="tana-confirm-save",d.textContent="Save to Tana",g.appendChild(m),g.appendChild(d),p.appendChild(x),p.appendChild(v),p.appendChild(g),i.appendChild(f),i.appendChild(p),e.appendChild(i),t.appendChild(e)}function B(){if(document.getElementById("tana-overlay-styles"))return;const t=document.createElement("style");t.id="tana-overlay-styles",t.textContent=`
    #tana-save-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Liberation Sans", Arial, sans-serif !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      color: #c9d1d9 !important;
      box-sizing: border-box !important;
      pointer-events: auto !important;
    }
    
    #tana-save-overlay * {
      box-sizing: border-box !important;
    }
    
    .tana-overlay-backdrop {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.8) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      box-sizing: border-box !important;
    }
    
    .tana-overlay-dialog {
      background: #161b22 !important;
      border: 1px solid #30363d !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
      width: 100% !important;
      max-width: 540px !important;
      max-height: 90vh !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      position: relative !important;
    }
    
    .tana-overlay-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 20px 24px 16px 24px !important;
      border-bottom: 1px solid #30363d !important;
      background: #0d1117 !important;
    }
    
    .tana-overlay-header h2 {
      margin: 0 !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      color: #f0f6fc !important;
    }
    
    .tana-overlay-close {
      background: transparent !important;
      border: none !important;
      color: #8b949e !important;
      cursor: pointer !important;
      padding: 8px !important;
      border-radius: 6px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s !important;
      margin: 0 !important;
    }
    
    .tana-overlay-close:hover {
      background: #21262d !important;
      color: #f0f6fc !important;
    }
    
    .tana-overlay-content {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 24px !important;
    }
    
    .tana-overlay-preview {
      margin-bottom: 20px !important;
      padding: 16px !important;
      background: #0d1117 !important;
      border: 1px solid #30363d !important;
      border-radius: 8px !important;
    }
    
    .tana-overlay-page-info {
      display: flex !important;
      flex-direction: column !important;
      gap: 6px !important;
    }
    
    .tana-overlay-page-title {
      font-weight: 600 !important;
      color: #f0f6fc !important;
      font-size: 15px !important;
      line-height: 1.4 !important;
    }
    
    .tana-overlay-page-url {
      color: #8b949e !important;
      font-size: 13px !important;
      word-break: break-all !important;
    }
    
    .tana-overlay-notes-section {
      margin-bottom: 24px !important;
    }
    
    .tana-overlay-label {
      display: block !important;
      margin-bottom: 8px !important;
      font-weight: 500 !important;
      color: #c9d1d9 !important;
      font-size: 14px !important;
    }
    
    .tana-overlay-notes-input {
      width: 100% !important;
      background: #0d1117 !important;
      color: #c9d1d9 !important;
      border: 1px solid #30363d !important;
      border-radius: 6px !important;
      padding: 12px !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      font-family: inherit !important;
      resize: vertical !important;
      min-height: 100px !important;
      box-sizing: border-box !important;
      transition: border-color 0.2s !important;
    }
    
    .tana-overlay-notes-input:focus {
      outline: none !important;
      border-color: #8b949e !important;
      box-shadow: 0 0 0 2px rgba(139, 148, 158, 0.3) !important;
    }
    
    .tana-overlay-notes-input::placeholder {
      color: #6e7681 !important;
    }
    
    .tana-overlay-actions {
      display: flex !important;
      gap: 12px !important;
      justify-content: flex-end !important;
    }
    
    .tana-overlay-button {
      border: none !important;
      border-radius: 6px !important;
      padding: 8px 16px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      transition: all 0.2s !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      font-family: inherit !important;
      line-height: 1.5 !important;
      margin: 0 !important;
    }
    
    .tana-overlay-button-secondary {
      background: #21262d !important;
      color: #f0f6fc !important;
      border: 1px solid #30363d !important;
    }
    
    .tana-overlay-button-secondary:hover {
      background: #30363d !important;
      border-color: #8b949e !important;
    }
    
    .tana-overlay-button-primary {
      background: #238636 !important;
      color: #ffffff !important;
      border: 1px solid #238636 !important;
    }
    
    .tana-overlay-button-primary:hover {
      background: #2ea043 !important;
      border-color: #2ea043 !important;
    }
    
    .tana-overlay-button-primary:disabled {
      background: #21262d !important;
      color: #6e7681 !important;
      border-color: #30363d !important;
      cursor: not-allowed !important;
    }
    
    /* Toast notifications */
    .tana-overlay-toast {
      position: fixed !important;
      top: 24px !important;
      right: 24px !important;
      background: #21262d !important;
      color: #f0f6fc !important;
      border: 1px solid #30363d !important;
      border-radius: 8px !important;
      padding: 12px 16px !important;
      font-size: 14px !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
      z-index: 2147483648 !important;
      opacity: 0 !important;
      transform: translateY(-8px) !important;
      transition: all 0.3s ease !important;
      pointer-events: none !important;
      font-family: inherit !important;
      max-width: 320px !important;
    }
    
    .tana-overlay-toast.show {
      opacity: 1 !important;
      transform: translateY(0) !important;
      pointer-events: auto !important;
    }
    
    .tana-overlay-toast.success {
      background: #1a7f37 !important;
      color: #ffffff !important;
      border-color: #238636 !important;
    }
    
    .tana-overlay-toast.error {
      background: #b62324 !important;
      color: #ffffff !important;
      border-color: #da3633 !important;
    }
    
    /* Responsive adjustments */
    @media (max-width: 600px) {
      .tana-overlay-backdrop {
        padding: 12px !important;
      }
      
      .tana-overlay-dialog {
        max-width: 100% !important;
        margin: 0 !important;
      }
      
      .tana-overlay-content {
        padding: 20px !important;
      }
      
      .tana-overlay-actions {
        flex-direction: column !important;
        gap: 8px !important;
      }
      
      .tana-overlay-button {
        width: 100% !important;
      }
    }
  `,document.head.appendChild(t)}function A(){if(r)try{const t=r.querySelector("#tana-close-overlay"),o=r.querySelector("#tana-cancel-save"),a=r.querySelector(".tana-overlay-backdrop");t&&t.addEventListener("click",l),o&&o.addEventListener("click",l),a&&a.addEventListener("click",e=>{e.target===a&&l()});const n=r.querySelector("#tana-confirm-save");n&&n.addEventListener("click",z),document.addEventListener("keydown",C,!0)}catch(t){console.error("Error setting up overlay event listeners:",t)}}function z(){if(!u||!r)return;const t=r.querySelector("#tana-notes-input"),o=t?t.value.trim():"";let a=u.content;o&&(a=o+`

`+a);const n={...u,content:a,notes:o},e=r.querySelector("#tana-confirm-save");e&&(e.disabled=!0,e.textContent="Saving..."),chrome.runtime.sendMessage({action:"saveToTana",data:n},i=>{i&&i.success?(l(),N("Page saved to Tana successfully!","success")):(e&&(e.disabled=!1,e.textContent="Save to Tana"),N(i?.error||"Save failed","error"))})}function C(t){r&&(t.key==="Escape"&&(t.preventDefault(),t.stopPropagation(),l()),(t.ctrlKey||t.metaKey)&&t.key==="Enter"&&(t.preventDefault(),t.stopPropagation(),z()))}function N(t,o="success"){const a=document.querySelector(".tana-overlay-toast");a&&a.remove();const n=document.createElement("div");n.className=`tana-overlay-toast ${o}`,n.textContent=t,document.body.appendChild(n),setTimeout(()=>{n.classList.add("show")},10),setTimeout(()=>{n.classList.remove("show"),setTimeout(()=>{n.parentNode&&n.remove()},300)},3e3)}window.addEventListener("beforeunload",()=>{l(),document.removeEventListener("keydown",C,!0)});
//# sourceMappingURL=content.js.map
