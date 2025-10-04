<?php
/**
 * REST API Handler
 * 
 * Registers WordPress REST API endpoints for the Research Profile Platform
 */

if (!defined('ABSPATH')) {
    exit;
}

class RPP_REST_API {
    
    private $namespace = 'research-profile/v1';
    private $openalex_api;
    
    public function __construct() {
        $this->openalex_api = new RPP_OpenAlex_API();
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register all REST API routes
     */
    public function register_routes() {
        // Public routes
        register_rest_route($this->namespace, '/researcher/(?P<openalex_id>[A-Za-z0-9]+)/data', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_researcher_data'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route($this->namespace, '/openalex/search/(?P<openalex_id>[A-Za-z0-9]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'search_openalex'),
            'permission_callback' => '__return_true'
        ));
        
        // Export researcher profile as static HTML (public)
        register_rest_route($this->namespace, '/researcher/(?P<openalex_id>[A-Za-z0-9]+)/export', array(
            'methods' => 'GET',
            'callback' => array($this, 'export_profile'),
            'permission_callback' => '__return_true'
        ));
        
        // Admin routes
        register_rest_route($this->namespace, '/admin/researcher/profile', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_profile'),
            'permission_callback' => array($this, 'check_admin_permission_with_logging')
        ));
        
        register_rest_route($this->namespace, '/admin/researcher/profile/(?P<openalex_id>[A-Za-z0-9]+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_profile'),
            'permission_callback' => array($this, 'check_admin_permission_with_logging')
        ));
        
        register_rest_route($this->namespace, '/admin/researcher/(?P<openalex_id>[A-Za-z0-9]+)/sync', array(
            'methods' => 'POST',
            'callback' => array($this, 'sync_researcher'),
            'permission_callback' => array($this, 'check_admin_permission_with_logging')
        ));
        
        register_rest_route($this->namespace, '/admin/researcher/(?P<openalex_id>[A-Za-z0-9]+)/upload-cv', array(
            'methods' => 'POST',
            'callback' => array($this, 'upload_cv'),
            'permission_callback' => array($this, 'check_admin_permission_with_logging')
        ));
    }
    
    /**
     * Check if user has admin permission (basic)
     */
    public function check_admin_permission() {
        return current_user_can('manage_options');
    }
    
    /**
     * Check admin permission with security logging and rate limiting
     */
    public function check_admin_permission_with_logging($request) {
        $user = wp_get_current_user();
        $ip = $this->get_client_ip();
        
        // Check rate limiting
        if (!$this->check_rate_limit($ip)) {
            $this->audit_log('RATE_LIMIT_EXCEEDED', $user->ID, $ip, $request->get_route());
            return new WP_Error(
                'rate_limit',
                'Rate limit exceeded for admin operations',
                array('status' => 429)
            );
        }
        
        // Check permission
        if (!current_user_can('manage_options')) {
            $this->audit_log('UNAUTHORIZED_ACCESS', $user->ID, $ip, $request->get_route());
            return false;
        }
        
        // Log successful admin access
        $this->audit_log('ADMIN_ACCESS', $user->ID, $ip, $request->get_route());
        return true;
    }
    
    /**
     * Get client IP address
     */
    private function get_client_ip() {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
        } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            $ip = $_SERVER['HTTP_X_REAL_IP'];
        }
        return $ip;
    }
    
    /**
     * Rate limiting check (15 min window, 100 requests max)
     */
    private function check_rate_limit($ip) {
        $transient_key = 'rpp_rate_limit_' . md5($ip);
        $data = get_transient($transient_key);
        
        if (!$data) {
            set_transient($transient_key, array('count' => 1, 'time' => time()), 15 * MINUTE_IN_SECONDS);
            return true;
        }
        
        if ($data['count'] >= 100) {
            return false;
        }
        
        $data['count']++;
        set_transient($transient_key, $data, 15 * MINUTE_IN_SECONDS);
        return true;
    }
    
    /**
     * Audit logging for security events
     */
    private function audit_log($action, $user_id, $ip, $details = '') {
        global $wpdb;
        $table = $wpdb->prefix . 'rpp_audit_log';
        
        // Create audit log table if doesn't exist
        $wpdb->query("CREATE TABLE IF NOT EXISTS $table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            action varchar(50) NOT NULL,
            user_id bigint(20) unsigned,
            ip_address varchar(100),
            details text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY action (action),
            KEY user_id (user_id),
            KEY created_at (created_at)
        ) " . $wpdb->get_charset_collate());
        
        // Insert log entry
        $wpdb->insert($table, array(
            'action' => $action,
            'user_id' => $user_id,
            'ip_address' => $ip,
            'details' => $details,
            'created_at' => current_time('mysql')
        ));
        
        // Also log to error_log for immediate visibility
        error_log(sprintf(
            'RPP Audit: %s | User: %d | IP: %s | Details: %s',
            $action,
            $user_id,
            $ip,
            $details
        ));
    }
    
    /**
     * Get researcher data (public endpoint)
     */
    public function get_researcher_data($request) {
        $openalex_id = $request['openalex_id'];
        
        // Get profile
        $profile = RPP_Database::get_profile_by_openalex_id($openalex_id);
        if (!$profile || !$profile['is_public']) {
            return new WP_Error('not_found', 'Researcher not found or not public', array('status' => 404));
        }
        
        // Get cached OpenAlex data
        $cached_data = RPP_Database::get_cached_data($openalex_id, 'researcher');
        $researcher_data = $cached_data ? $cached_data['data'] : null;
        
        // Get topics
        $topics = RPP_Database::get_topics($openalex_id);
        
        // Get publications
        $publications = RPP_Database::get_publications($openalex_id, 50);
        
        // Get affiliations
        $affiliations = RPP_Database::get_affiliations($openalex_id);
        
        return rest_ensure_response(array(
            'profile' => $profile,
            'openalexData' => $researcher_data,
            'topics' => $topics,
            'publications' => $publications,
            'affiliations' => $affiliations
        ));
    }
    
    /**
     * Search OpenAlex API
     */
    public function search_openalex($request) {
        $openalex_id = $request['openalex_id'];
        
        $data = $this->openalex_api->get_researcher($openalex_id);
        
        if (!$data) {
            return new WP_Error('not_found', 'Researcher not found in OpenAlex', array('status' => 404));
        }
        
        return rest_ensure_response($data);
    }
    
    /**
     * Export researcher profile as static HTML
     */
    public function export_profile($request) {
        $openalex_id = $request['openalex_id'];
        
        // Get profile (must be public)
        $profile = RPP_Database::get_profile_by_openalex_id($openalex_id);
        if (!$profile || !$profile['is_public']) {
            return new WP_Error('not_found', 'Researcher not found or not public', array('status' => 404));
        }
        
        // Get all data
        $cached_data = RPP_Database::get_cached_data($openalex_id, 'researcher');
        $researcher_data = $cached_data ? $cached_data['data'] : null;
        $topics = RPP_Database::get_topics($openalex_id);
        $publications = RPP_Database::get_publications($openalex_id, 100);
        $affiliations = RPP_Database::get_affiliations($openalex_id);
        
        // Generate static HTML
        $html = $this->generate_static_html(array(
            'profile' => $profile,
            'researcher' => $researcher_data,
            'topics' => $topics,
            'publications' => $publications,
            'affiliations' => $affiliations,
            'exportedAt' => current_time('c'),
            'exportUrl' => home_url('/researcher/' . $openalex_id)
        ));
        
        // Return as downloadable HTML file
        $filename = sanitize_file_name(($profile['display_name'] ?: 'researcher') . '-profile.html');
        
        // Use WP_REST_Response to set headers
        $response = new WP_REST_Response($html);
        $response->set_headers(array(
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ));
        
        return $response;
    }
    
    /**
     * Generate static HTML for researcher profile export
     */
    private function generate_static_html($data) {
        $profile = $data['profile'];
        $researcher = $data['researcher'];
        $topics = $data['topics'];
        $publications = $data['publications'];
        $affiliations = $data['affiliations'];
        $exported_at = $data['exportedAt'];
        $export_url = $data['exportUrl'];
        
        $display_name = esc_html($profile['display_name'] ?: 'Researcher Profile');
        $title = esc_html($profile['title'] ?: '');
        $bio = esc_html($profile['bio'] ?: '');
        $affiliation = esc_html($profile['current_affiliation'] ?: '');
        $pub_count = count($publications);
        $citations = isset($researcher['cited_by_count']) ? number_format($researcher['cited_by_count']) : '0';
        $h_index = isset($researcher['summary_stats']['h_index']) ? $researcher['summary_stats']['h_index'] : 'N/A';
        
        ob_start();
        ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $display_name; ?> - Academic Profile</title>
    <meta name="description" content="<?php echo $bio; ?>">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body class="bg-gray-50 text-gray-900">
    <!-- Header -->
    <header class="gradient-bg text-white py-20">
        <div class="max-w-6xl mx-auto px-6">
            <div class="text-center">
                <h1 class="text-5xl font-bold mb-4"><?php echo $display_name; ?></h1>
                <?php if ($title): ?>
                    <p class="text-xl mb-4"><?php echo $title; ?></p>
                <?php endif; ?>
                <?php if ($affiliation): ?>
                    <p class="text-lg"><?php echo $affiliation; ?></p>
                <?php endif; ?>
                <?php if ($bio): ?>
                    <p class="mt-6 max-w-3xl mx-auto"><?php echo $bio; ?></p>
                <?php endif; ?>
            </div>
        </div>
    </header>

    <!-- Stats -->
    <section class="py-16 -mt-10 relative z-10">
        <div class="max-w-6xl mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-blue-600"><?php echo $pub_count; ?></div>
                    <div class="text-gray-600">Publications</div>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-purple-600"><?php echo $citations; ?></div>
                    <div class="text-gray-600">Citations</div>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-green-600"><?php echo $h_index; ?></div>
                    <div class="text-gray-600">h-index</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Publications -->
    <?php if (!empty($publications)): ?>
    <section class="py-16 bg-white">
        <div class="max-w-6xl mx-auto px-6">
            <h2 class="text-3xl font-bold mb-8">Recent Publications</h2>
            <div class="space-y-4">
                <?php foreach (array_slice($publications, 0, 20) as $pub): ?>
                <div class="border-l-4 border-blue-500 pl-4">
                    <h3 class="font-semibold text-lg"><?php echo esc_html($pub['title']); ?></h3>
                    <?php if ($pub['author_names']): ?>
                        <p class="text-sm text-gray-600"><?php echo esc_html($pub['author_names']); ?></p>
                    <?php endif; ?>
                    <p class="text-sm text-gray-500">
                        <?php echo $pub['journal'] ? esc_html($pub['journal']) . ' · ' : ''; ?>
                        <?php echo $pub['publication_year']; ?> ·
                        <?php echo number_format($pub['citation_count']); ?> citations
                    </p>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- Footer -->
    <footer class="bg-gray-100 py-8 text-center text-gray-600 no-print">
        <p>Exported from <a href="<?php echo esc_url($export_url); ?>" class="text-blue-600"><?php echo esc_url($export_url); ?></a></p>
        <p class="text-sm mt-2">Generated on <?php echo date('F j, Y', strtotime($exported_at)); ?></p>
    </footer>
</body>
</html>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Create researcher profile (admin only)
     */
    public function create_profile($request) {
        $params = $request->get_json_params();
        
        // Validate required fields
        if (empty($params['openalex_id'])) {
            return new WP_Error('missing_field', 'OpenAlex ID is required', array('status' => 400));
        }
        
        // Normalize OpenAlex ID
        $openalex_id = $this->normalize_openalex_id($params['openalex_id']);
        if (!preg_match('/^A\d+$/', $openalex_id)) {
            return new WP_Error('invalid_id', 'OpenAlex ID must start with A followed by numbers', array('status' => 400));
        }
        
        // Set defaults
        $data = array(
            'user_id' => get_current_user_id(),
            'openalex_id' => $openalex_id,
            'display_name' => isset($params['displayName']) ? sanitize_text_field($params['displayName']) : null,
            'title' => isset($params['title']) ? sanitize_text_field($params['title']) : null,
            'bio' => isset($params['bio']) ? sanitize_textarea_field($params['bio']) : null,
            'current_affiliation' => isset($params['currentAffiliation']) ? sanitize_text_field($params['currentAffiliation']) : null,
            'current_position' => isset($params['currentPosition']) ? sanitize_text_field($params['currentPosition']) : null,
            'current_affiliation_url' => isset($params['currentAffiliationUrl']) ? esc_url_raw($params['currentAffiliationUrl']) : null,
            'current_affiliation_start_date' => isset($params['currentAffiliationStartDate']) && !empty($params['currentAffiliationStartDate']) ? $params['currentAffiliationStartDate'] : null,
            'is_public' => isset($params['isPublic']) ? (bool)$params['isPublic'] : true,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );
        
        $profile = RPP_Database::upsert_profile($data);
        
        // Trigger sync in background - this runs asynchronously
        if ($profile) {
            wp_schedule_single_event(time() + 5, 'rpp_sync_researcher', array($openalex_id));
            
            // Also log that sync was scheduled
            error_log("RPP: Scheduled background sync for researcher $openalex_id");
        }
        
        // Return immediately - don't wait for sync to complete
        return rest_ensure_response(array(
            'success' => true,
            'profile' => $profile,
            'message' => 'Profile created successfully. Data sync running in background.'
        ));
    }
    
    /**
     * Update researcher profile (admin only)
     */
    public function update_profile($request) {
        $openalex_id = $request['openalex_id'];
        $params = $request->get_json_params();
        
        $profile = RPP_Database::get_profile_by_openalex_id($openalex_id);
        if (!$profile) {
            return new WP_Error('not_found', 'Profile not found', array('status' => 404));
        }
        
        // Build update data
        $data = array();
        if (isset($params['displayName'])) {
            $data['display_name'] = sanitize_text_field($params['displayName']);
        }
        if (isset($params['title'])) {
            $data['title'] = sanitize_text_field($params['title']);
        }
        if (isset($params['bio'])) {
            $data['bio'] = sanitize_textarea_field($params['bio']);
        }
        if (isset($params['currentAffiliation'])) {
            $data['current_affiliation'] = sanitize_text_field($params['currentAffiliation']);
        }
        if (isset($params['currentPosition'])) {
            $data['current_position'] = sanitize_text_field($params['currentPosition']);
        }
        if (isset($params['currentAffiliationUrl'])) {
            $data['current_affiliation_url'] = esc_url_raw($params['currentAffiliationUrl']);
        }
        if (isset($params['currentAffiliationStartDate'])) {
            $data['current_affiliation_start_date'] = !empty($params['currentAffiliationStartDate']) ? $params['currentAffiliationStartDate'] : null;
        }
        if (isset($params['isPublic'])) {
            $data['is_public'] = (bool)$params['isPublic'];
        }
        if (isset($params['cvUrl'])) {
            $data['cv_url'] = esc_url_raw($params['cvUrl']);
        }
        
        $data['openalex_id'] = $openalex_id;
        $updated_profile = RPP_Database::upsert_profile($data);
        
        return rest_ensure_response($updated_profile);
    }
    
    /**
     * Sync researcher data from OpenAlex (admin only)
     */
    public function sync_researcher($request) {
        $openalex_id = $request['openalex_id'];
        
        $profile = RPP_Database::get_profile_by_openalex_id($openalex_id);
        if (!$profile) {
            return new WP_Error('not_found', 'Profile not found', array('status' => 404));
        }
        
        try {
            $results = $this->openalex_api->sync_researcher_data($openalex_id);
            
            return rest_ensure_response(array(
                'success' => true,
                'message' => 'Data synchronized successfully',
                'results' => $results
            ));
        } catch (Exception $e) {
            return new WP_Error('sync_failed', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Upload CV (admin only)
     */
    public function upload_cv($request) {
        $openalex_id = $request['openalex_id'];
        
        $profile = RPP_Database::get_profile_by_openalex_id($openalex_id);
        if (!$profile) {
            return new WP_Error('not_found', 'Profile not found', array('status' => 404));
        }
        
        // Get uploaded file
        $files = $request->get_file_params();
        if (empty($files['cv'])) {
            return new WP_Error('no_file', 'No file uploaded', array('status' => 400));
        }
        
        $file = $files['cv'];
        
        // Check file type
        if ($file['type'] !== 'application/pdf') {
            return new WP_Error('invalid_type', 'Only PDF files are allowed', array('status' => 400));
        }
        
        // Check file size (10MB max)
        if ($file['size'] > 10 * 1024 * 1024) {
            return new WP_Error('file_too_large', 'File must be less than 10MB', array('status' => 400));
        }
        
        // Use WordPress media upload
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        $attachment_id = media_handle_sideload($file, 0, 'CV for ' . $openalex_id);
        
        if (is_wp_error($attachment_id)) {
            return $attachment_id;
        }
        
        $cv_url = wp_get_attachment_url($attachment_id);
        
        // Update profile with CV URL
        global $wpdb;
        $table = $wpdb->prefix . 'rpp_profiles';
        $wpdb->update(
            $table,
            array('cv_url' => $cv_url),
            array('openalex_id' => $openalex_id)
        );
        
        return rest_ensure_response(array(
            'success' => true,
            'cv_url' => $cv_url,
            'attachment_id' => $attachment_id
        ));
    }
    
    /**
     * Normalize OpenAlex ID
     */
    private function normalize_openalex_id($id) {
        $id = trim($id);
        if (strtolower(substr($id, 0, 1)) === 'a') {
            $id = 'A' . substr($id, 1);
        } elseif (!str_starts_with($id, 'A')) {
            $id = 'A' . $id;
        }
        return $id;
    }
}

// Register sync action for background processing
add_action('rpp_sync_researcher', function($openalex_id) {
    $api = new RPP_OpenAlex_API();
    $api->sync_researcher_data($openalex_id);
});
