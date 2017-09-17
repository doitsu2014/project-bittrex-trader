jQuery(document).ready(function($){
	/// LOGIN POPUP
	//open popup
	$('.cd-login-popup-trigger').on('click', function(event){
		event.preventDefault();
		$('.cd-login-popup').addClass('is-visible');
	});
	
	//close popup
	$('.cd-login-popup').on('click', function(event){
		if( $(event.target).is('.cd-login-popup-close') || $(event.target).is('.cd-login-popup')) {
			event.preventDefault();
			$(this).removeClass('is-visible');
		}
	});

	//close popup customize
	$('.cd-login-popup').on('click', function(event){
		if($(event.target).is('.buttom-confirm')) {
			$(this).removeClass('is-visible');
		}
	});
	
	/// ABOUT ME POPUP
	//open popup
	$('.cd-aboutme-popup-trigger').on('click', function(event){
		event.preventDefault();
		$('.cd-aboutme-popup').addClass('is-visible');
	});
	
	//close popup
	$('.cd-aboutme-popup').on('click', function(event){
		if( $(event.target).is('.cd-aboutme-popup-close') || $(event.target).is('.cd-aboutme-popup')) {
			event.preventDefault();
			$(this).removeClass('is-visible');
		}
	});

	// LOGS POPUP
	


	//close popup when clicking the esc keyboard button
	$(document).keyup(function(event){
    	if(event.which=='27'){
			$('.cd-login-popup').removeClass('is-visible');
    		$('.cd-aboutme-popup').removeClass('is-visible');
    		$('.cd-tradelogs-popup').removeClass('is-visible');
			
	    }
	});
});