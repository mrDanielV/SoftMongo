Node.prototype.isTextContent = function(){
	if(!this.childNodes) return false;
	var res = 0;
	for(var i=0;i<this.childNodes.length;i++){
		if(this.childNodes[i].nodeType == Node.TEXT_NODE || this.childNodes[i].nodeType == Node.COMMENT_NODE){
			res++;
		} else {
			/* if(
				!['DIV','TR','TD','TH','TABLE','TBODY','THEAD','COLGROUP','COL','STRONG','B','I','EM','SUP','SUB','LI','OL','UL'].present(this.childNodes[i].nodeName) && 
				this.childNodes[i].isTextContent() &&
				this.childNodes[i].getAttribute('style')
			){
				res++;
			} */
		}
	};
	return res == this.childNodes.length;
};

Node.prototype.simplify = function(){
	// Упрощение ноды
	if(this.childNodes && this.childNodes.length==1){
		if(['SPAN','A','P'].present(this.childNodes[0].nodeName) && this.childNodes[0].isTextContent()){
			this.innerHTML = this.textContent;
		}
	}
}