<?php
/**
 * Research Profile Platform - WordPress Theme Functions
 * 
 * This theme loads a React application built with Vite.
 * The backend API runs separately on a Node.js server.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Theme setup
 */
function research_profile_setup() {
    // Add theme support
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    
    // Remove WordPress admin bar for cleaner display
    add_filter('show_admin_bar', '__return_false');
}
add_action('after_setup_theme', 'research_profile_setup');

/**
 * Enqueue React app scripts and styles
 */
function research_profile_enqueue_scripts() {
    $theme_dir = get_template_directory_uri();
    $build_dir = $theme_dir . '/build';
    
    // Parse the index.html to extract asset filenames
    $index_html_path = get_template_directory() . '/build/index.html';
    
    if (file_exists($index_html_path)) {
        $html_content = file_get_contents($index_html_path);
        
        // Extract CSS file
        if (preg_match('/<link rel="stylesheet"[^>]*href="([^"]+)"/', $html_content, $css_match)) {
            $css_file = $css_match[1];
            wp_enqueue_style(
                'research-profile-css',
                $build_dir . $css_file,
                array(),
                null
            );
        }
        
        // Extract JS file
        if (preg_match('/<script[^>]*src="([^"]+)"[^>]*><\/script>/', $html_content, $js_match)) {
            $js_file = $js_match[1];
            wp_enqueue_script(
                'research-profile-main',
                $build_dir . $js_file,
                array(),
                null,
                true
            );
            
            // Pass configuration to the React app
            $api_url = get_option('research_profile_api_url', 'http://localhost:5000');
            
            wp_localize_script('research-profile-main', 'ResearchProfileConfig', array(
                'apiUrl' => $api_url,
                'siteUrl' => get_site_url(),
                'themePath' => $theme_dir,
            ));
        }
    }
}
add_action('wp_enqueue_scripts', 'research_profile_enqueue_scripts');

/**
 * Add settings page for API configuration
 */
function research_profile_settings_page() {
    add_options_page(
        'Research Profile Settings',
        'Research Profile',
        'manage_options',
        'research-profile-settings',
        'research_profile_settings_page_html'
    );
}
add_action('admin_menu', 'research_profile_settings_page');

/**
 * Settings page HTML
 */
function research_profile_settings_page_html() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    // Save settings
    if (isset($_POST['research_profile_api_url'])) {
        check_admin_referer('research_profile_settings');
        update_option('research_profile_api_url', sanitize_text_field($_POST['research_profile_api_url']));
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    
    $api_url = get_option('research_profile_api_url', 'http://localhost:5000');
    ?>
    <div class="wrap">
        <h1>Research Profile Platform Settings</h1>
        <form method="post" action="">
            <?php wp_nonce_field('research_profile_settings'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="research_profile_api_url">Backend API URL</label>
                    </th>
                    <td>
                        <input 
                            type="url" 
                            id="research_profile_api_url" 
                            name="research_profile_api_url" 
                            value="<?php echo esc_attr($api_url); ?>" 
                            class="regular-text"
                            placeholder="https://your-api-server.com"
                        />
                        <p class="description">
                            Enter the URL of your Node.js backend API server (e.g., https://api.yoursite.com)
                        </p>
                    </td>
                </tr>
            </table>
            <?php submit_button('Save Settings'); ?>
        </form>
        
        <hr>
        
        <h2>Installation Instructions</h2>
        <ol>
            <li>Deploy your Node.js backend server separately (keep it running)</li>
            <li>Enter the backend API URL above</li>
            <li>Make sure your Node.js server is accessible from this WordPress installation</li>
            <li>The React app will automatically connect to the API</li>
        </ol>
        
        <h2>Backend Requirements</h2>
        <ul>
            <li>Node.js server running (port 5000 or custom port)</li>
            <li>PostgreSQL database configured</li>
            <li>Google Cloud Storage for file uploads</li>
            <li>Environment variables properly set (DATABASE_URL, ADMIN_API_TOKEN, etc.)</li>
        </ul>
    </div>
    <?php
}

/**
 * Remove default WordPress content
 */
function research_profile_remove_default_content() {
    remove_action('wp_head', 'wp_generator');
    remove_action('wp_head', 'wlwmanifest_link');
    remove_action('wp_head', 'rsd_link');
}
add_action('init', 'research_profile_remove_default_content');
